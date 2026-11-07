import { fallbackLanguage, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import type {
  DeliveredPushPayload,
  PushNotification,
  PushNotificationRequest,
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
import webpush from "web-push";
import { PUSH_SUBSCRIPTIONS_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:support@hacado.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

function serializePushError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const err = error as {
    message?: string;
    name?: string;
    stack?: string;
    statusCode?: number;
    body?: string;
    endpoint?: string;
  };

  return {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    body: err.body,
    endpoint: err.endpoint,
    stack: err.stack,
  };
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
    logger.debug(
      {
        endpoint: input.endpoint,
        memberId: input.memberId,
        userId: input.userId,
        organizationId: input.organizationId,
        hasExpirationTime: input.expirationTime != null,
        userAgent: input.userAgent,
      },
      "Upserting push subscription",
    );

    if (input.organizationId !== this.organizationId) {
      logger.warn(
        {
          inputOrganizationId: input.organizationId,
          organizationId: this.organizationId,
        },
        "Push subscription organization mismatch",
      );

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

    logger.debug(
      {
        endpoint: input.endpoint,
        foundSameOrg: Boolean(sameOrgExisting),
        previousMemberId: sameOrgExisting?.memberId,
      },
      "Looked up same-org push subscription",
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

        logger.debug(
          {
            endpoint: input.endpoint,
            previousOrganizationId: foreignExisting.organizationId,
            keysMatch,
          },
          "Found foreign push subscription for endpoint",
        );

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

    const updateResult = await collection.updateOne(
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

    logger.debug(
      {
        endpoint: input.endpoint,
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        upsertedCount: updateResult.upsertedCount,
      },
      "Push subscription update result",
    );

    logger.info(
      {
        endpoint: input.endpoint,
        memberId: input.memberId,
        organizationId: this.organizationId,
        created: !sameOrgExisting,
      },
      "Upserted push subscription",
    );

    return record;
  }

  public async deleteSubscriptionByEndpoint(endpoint: string): Promise<void> {
    const logger = this.loggerFactory("deleteSubscriptionByEndpoint");
    logger.debug({ endpoint }, "Deleting push subscription by endpoint");

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
    logger.debug({ memberId }, "Deleting push subscriptions by member");

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
    const logger = this.loggerFactory("listSubscriptionsByOrganization");
    logger.debug("Listing push subscriptions for organization");

    const db = await getDbConnection();
    const subscriptions = await db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .find({ organizationId: this.organizationId })
      .toArray();

    logger.debug(
      { count: subscriptions.length },
      "Listed push subscriptions for organization",
    );

    return subscriptions;
  }

  public async getSubscriptionByEndpoint(
    endpoint: string,
  ): Promise<PushSubscriptionRecord | null> {
    const logger = this.loggerFactory("getSubscriptionByEndpoint");
    logger.debug({ endpoint }, "Getting push subscription by endpoint");

    const db = await getDbConnection();
    const subscription = await db
      .collection<PushSubscriptionRecord>(PUSH_SUBSCRIPTIONS_COLLECTION_NAME)
      .findOne(this.withOrganizationFilter({ endpoint }));

    logger.debug(
      {
        endpoint,
        found: Boolean(subscription),
        memberId: subscription?.memberId,
      },
      "Push subscription lookup result",
    );

    return subscription;
  }

  public async prepareDeliveries(
    notification: PushNotification,
  ): Promise<PushNotificationRequest[]> {
    const logger = this.loggerFactory("prepareDeliveries");
    logger.debug(
      {
        url: notification.url,
        tag: notification.tag,
        audience: notification.audience,
      },
      "Preparing push notification deliveries",
    );

    const subscriptions = await this.listSubscriptionsByOrganization();
    if (subscriptions.length === 0) {
      logger.debug("No push subscriptions for organization");
      return [];
    }

    logger.debug(
      { subscriptionCount: subscriptions.length },
      "Loaded push subscriptions for preparation",
    );

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
    const deliveries: PushNotificationRequest[] = [];
    let skippedCount = 0;

    for (const subscription of subscriptions) {
      try {
        let resolved = memberCache.get(subscription.memberId);

        if (!resolved) {
          const member = await this.teamService.getMemberById(
            subscription.memberId,
          );

          if (!member || member.status !== "active") {
            logger.debug(
              {
                endpoint: subscription.endpoint,
                memberId: subscription.memberId,
                memberStatus: member?.status,
              },
              "Pruning push subscription for missing/inactive member",
            );

            deadEndpoints.push(subscription.endpoint);
            continue;
          }

          if (
            !notificationAudienceMatches(
              { memberId: member._id, role: member.role },
              notification.audience,
            )
          ) {
            logger.debug(
              {
                memberId: member._id,
                role: member.role,
                audience: notification.audience,
              },
              "Skipping push subscription; audience mismatch",
            );

            memberCache.set(subscription.memberId, { skip: true });
            skippedCount += 1;
            continue;
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
          skippedCount += 1;
          continue;
        }

        deliveries.push({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          expirationTime: subscription.expirationTime ?? null,
          memberId: subscription.memberId,
          payload: {
            title: resolved.title,
            body: resolved.body,
            url: notification.url,
            tag: notification.tag,
          },
        });
      } catch (error) {
        logger.error(
          { error, endpoint: subscription.endpoint },
          "Failed to prepare push notification delivery",
        );
      }
    }

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

    logger.debug(
      {
        subscriptionCount: subscriptions.length,
        deliveryCount: deliveries.length,
        skippedCount,
        prunedCount: deadEndpoints.length,
      },
      "Finished preparing push notification deliveries",
    );

    return deliveries;
  }

  public async sendToSubscription(
    subscription: Pick<
      PushSubscriptionRecord,
      "endpoint" | "keys" | "expirationTime" | "memberId"
    >,
    payload: DeliveredPushPayload,
  ): Promise<"ok" | "gone"> {
    const logger = this.loggerFactory("sendToSubscription");
    logger.debug(
      {
        endpoint: subscription.endpoint,
        memberId: subscription.memberId,
        url: payload.url,
        tag: payload.tag,
      },
      "Sending web push notification",
    );

    const vapid = getVapidConfig();
    if (!vapid) {
      logger.warn("VAPID keys not configured; cannot send push");
      throw new Error("VAPID keys not configured");
    }

    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

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

      logger.debug(
        { endpoint: subscription.endpoint, memberId: subscription.memberId },
        "Web push notification sent",
      );

      return "ok";
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? (error as { statusCode?: number }).statusCode
          : undefined;

      if (statusCode === 404 || statusCode === 410) {
        logger.info(
          { endpoint: subscription.endpoint, statusCode },
          "Push subscription gone",
        );

        return "gone";
      }

      logger.error(
        {
          endpoint: subscription.endpoint,
          memberId: subscription.memberId,
          statusCode,
          err: serializePushError(error),
        },
        "Web push send failed",
      );

      throw error;
    }
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
