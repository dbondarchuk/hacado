import { fallbackLanguage, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import type {
  DeliveredPushPayload,
  PushNotification,
  PushSubscriptionRecord,
  UpsertPushSubscriptionInput,
} from "@hacado/types/apps";
import type {
  IConfigurationService,
  IPushNotificationsService,
  ITeamService,
} from "@hacado/types/services";
import { notificationAudienceMatches } from "@hacado/utils/permissions";
import { resolvedI18nText } from "@hacado/utils/resolved-i18n-text";
import { ObjectId } from "mongodb";
import * as webpush from "web-push";
import { PUSH_SUBSCRIPTIONS_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@hacado.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export class PushNotificationsService
  extends BaseService
  implements IPushNotificationsService
{
  public constructor(
    organizationId: string,
    private readonly teamService: ITeamService,
    private readonly configurationService: IConfigurationService,
  ) {
    super("PushNotificationsService", organizationId);
  }

  public async upsertSubscription(
    input: UpsertPushSubscriptionInput,
  ): Promise<PushSubscriptionRecord> {
    const logger = this.loggerFactory("upsertSubscription");

    if (input.organizationId !== this.organizationId) {
      throw new Error("Push subscription organization mismatch");
    }

    const db = await getDbConnection();
    const now = new Date();
    const collection = db.collection<PushSubscriptionRecord>(
      PUSH_SUBSCRIPTIONS_COLLECTION_NAME,
    );

    const sameOrgExisting = await collection.findOne(
      this.withOrganizationFilter({ endpoint: input.endpoint }),
    );

    // Endpoints are globally unique. Only reclaim a foreign binding when the
    // caller proves control of the same PushSubscription keys.
    if (!sameOrgExisting) {
      const foreignExisting = await collection.findOne({
        endpoint: input.endpoint,
        organizationId: { $ne: this.organizationId },
      });

      if (foreignExisting) {
        const keysMatch =
          foreignExisting.keys.p256dh === input.keys.p256dh &&
          foreignExisting.keys.auth === input.keys.auth;

        if (!keysMatch) {
          logger.warn(
            {
              endpoint: input.endpoint,
              previousOrganizationId: foreignExisting.organizationId,
              organizationId: this.organizationId,
            },
            "Rejected push endpoint reclaim without matching keys",
          );

          throw new Error(
            "Push endpoint is registered to another organization",
          );
        }

        logger.info(
          {
            endpoint: input.endpoint,
            previousOrganizationId: foreignExisting.organizationId,
            organizationId: this.organizationId,
          },
          "Reassigning push endpoint from another organization",
        );

        await collection.deleteOne({
          _id: foreignExisting._id,
          endpoint: input.endpoint,
        });
      }
    }

    const _id = sameOrgExisting?._id ?? new ObjectId().toString();
    const createdAt = sameOrgExisting?.createdAt ?? now;
    const record: PushSubscriptionRecord = {
      _id,
      organizationId: this.organizationId,
      memberId: input.memberId,
      userId: input.userId,
      endpoint: input.endpoint,
      keys: input.keys,
      expirationTime: input.expirationTime ?? null,
      userAgent: input.userAgent,
      createdAt,
      updatedAt: now,
    };

    await collection.updateOne(
      this.withOrganizationFilter({ endpoint: input.endpoint }),
      {
        $set: {
          organizationId: record.organizationId,
          memberId: record.memberId,
          userId: record.userId,
          endpoint: record.endpoint,
          keys: record.keys,
          expirationTime: record.expirationTime,
          userAgent: record.userAgent,
          updatedAt: record.updatedAt,
        },
        $setOnInsert: {
          _id: record._id,
          createdAt: record.createdAt,
        },
      },
      { upsert: true },
    );

    logger.info(
      {
        endpoint: input.endpoint,
        memberId: input.memberId,
        organizationId: this.organizationId,
      },
      "Upserted push subscription",
    );

    return record;
  }

  public async deleteSubscriptionByEndpoint(endpoint: string): Promise<void> {
    const logger = this.loggerFactory("deleteSubscriptionByEndpoint");
    const db = await getDbConnection();
    const result = await db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .deleteOne(this.withOrganizationFilter({ endpoint }));

    logger.info(
      { endpoint, deletedCount: result.deletedCount },
      "Deleted push subscription by endpoint",
    );
  }

  public async deleteSubscriptionsByMemberId(memberId: string): Promise<void> {
    const logger = this.loggerFactory("deleteSubscriptionsByMemberId");
    const db = await getDbConnection();
    const result = await db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .deleteMany(
        this.withOrganizationFilter({ memberId } as Record<string, unknown>),
      );

    logger.info(
      { memberId, deletedCount: result.deletedCount },
      "Deleted push subscriptions by member",
    );
  }

  public async listSubscriptionsByOrganization(): Promise<
    PushSubscriptionRecord[]
  > {
    const db = await getDbConnection();
    return db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .find({ organizationId: this.organizationId })
      .toArray();
  }

  public async getSubscriptionByEndpoint(
    endpoint: string,
  ): Promise<PushSubscriptionRecord | null> {
    const db = await getDbConnection();
    return db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .findOne(this.withOrganizationFilter({ endpoint }));
  }

  public async deliver(notification: PushNotification): Promise<void> {
    const logger = this.loggerFactory("deliver");
    const vapid = getVapidConfig();
    if (!vapid) {
      logger.warn("VAPID keys not configured; skipping push delivery");
      return;
    }

    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const subscriptions = await this.listSubscriptionsByOrganization();
    if (subscriptions.length === 0) {
      logger.debug("No push subscriptions for organization");
      return;
    }

    const general = await this.configurationService.getConfiguration("general");
    const timeZone = general.timeZone;
    const currency = general.currency;

    const memberCache = new Map<
      string,
      | {
          locale: Language;
          title: string;
          body: string;
        }
      | { skip: true }
    >();

    const deadEndpoints: string[] = [];

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          let resolved = memberCache.get(subscription.memberId);

          if (!resolved) {
            const member = await this.teamService.getMemberById(
              subscription.memberId,
            );

            if (!member || member.status !== "active") {
              deadEndpoints.push(subscription.endpoint);
              return;
            }

            if (
              !notificationAudienceMatches(
                { memberId: member._id, role: member.role },
                notification.audience,
              )
            ) {
              memberCache.set(subscription.memberId, { skip: true });
              return;
            }

            const locale = (member.language ?? fallbackLanguage) as Language;
            const t = await getI18nAsync({ locale });
            resolved = {
              locale,
              title: resolvedI18nText(
                notification.title,
                t,
                timeZone,
                locale,
                currency,
              ),
              body: resolvedI18nText(
                notification.body,
                t,
                timeZone,
                locale,
                currency,
              ),
            };

            memberCache.set(subscription.memberId, resolved);
          }

          if ("skip" in resolved) {
            return;
          }

          const result = await this.sendToSubscription(subscription, {
            title: resolved.title,
            body: resolved.body,
            url: notification.url,
            tag: notification.tag,
          });

          if (result === "gone") {
            deadEndpoints.push(subscription.endpoint);
          }
        } catch (error) {
          logger.error(
            { error, endpoint: subscription.endpoint },
            "Failed to deliver push notification",
          );
        }
      }),
    );

    if (deadEndpoints.length > 0) {
      const db = await getDbConnection();
      await db
        .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
        .deleteMany(
          this.withOrganizationFilter({
            endpoint: { $in: deadEndpoints },
          }),
        );

      logger.info(
        { count: deadEndpoints.length },
        "Pruned dead push subscriptions",
      );
    }
  }

  public async sendToSubscription(
    subscription: PushSubscriptionRecord,
    payload: DeliveredPushPayload,
  ): Promise<"ok" | "gone"> {
    const logger = this.loggerFactory("sendToSubscription");

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          expirationTime: subscription.expirationTime ?? undefined,
        },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 },
      );

      return "ok";
    } catch (error: any) {
      const statusCode = error?.statusCode as number | undefined;
      if (statusCode === 404 || statusCode === 410) {
        logger.info(
          { endpoint: subscription.endpoint, statusCode },
          "Push subscription gone",
        );

        return "gone";
      }

      throw error;
    }
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
