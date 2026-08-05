import type { Product } from "@polar-sh/sdk/models/components/product";
import type {
  BillingConsumeSmsInput,
  BillingInterval,
  BillingPeriod,
  BillingRecordSmsUsageInput,
  BillingSubscriptionPrice,
  IBillingService,
  IEventService,
  IOrganizationService,
  OrganizationBillingSeatAddonSubscription,
  OrganizationBillingSeatsBenefit,
  OrganizationBillingSubscriptionDetails,
  SmsCreditsState,
} from "@hacado/types";
import {
  Organization,
  parseOrganizationSubscriptionStatus,
  SMS_TOPUP_PURCHASED_EVENT_TYPE,
  SmsCreditsExhaustedError,
  systemEventSource,
} from "@hacado/types";
import { ORGANIZATIONS_COLLECTION_NAME } from "../collections";
import { getDbConnection } from "../database";
import { BaseService } from "../services/base.service";
import type { PolarClientWrapper } from "./polar-client-wrapper";
import { resolvePlanTierFromProductId } from "./subscription-entitlements";
import { maybeEmitSmsCreditThresholdEvent } from "./sms-credit-threshold-notify";

function assertNonNegInt(n: number, label: string) {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function meterCreditUnitsForMeter(
  product: Product | { benefits?: Product["benefits"] } | null | undefined,
  meterId: string,
): number | null {
  const id = meterId.trim();
  if (!id || !product?.benefits?.length) return null;
  for (const benefit of product.benefits) {
    if (benefit.type !== "meter_credit") continue;
    if (benefit.properties.meterId !== id) continue;
    return Math.max(0, benefit.properties.units);
  }

  return null;
}

export class PolarBillingService
  extends BaseService
  implements IBillingService
{
  public constructor(
    organizationId: string,
    private readonly organizationService: IOrganizationService,
    private readonly eventService: IEventService,
    private readonly polar: PolarClientWrapper,
  ) {
    super("PolarBillingService", organizationId);
  }

  public async getSmsCreditBalance(): Promise<SmsCreditsState> {
    const logger = this.loggerFactory("getSmsCreditBalance");
    logger.debug("Reading SMS pool");

    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const row = await collection.findOne(
      { _id: this.organizationId },
      { projection: { _id: 1, smsBalance: 1, feesExempt: 1 } },
    );

    if (!row?.smsBalance || row.feesExempt === true) {
      logger.debug("No SMS balance; skipping SMS pool read");
      return { feesExempt: row?.feesExempt ?? false, included: 0, topup: 0 };
    }

    const result = {
      included: Math.max(0, row.smsBalance.included ?? 0),
      topup: Math.max(0, row.smsBalance.topup ?? 0),
      feesExempt: row.feesExempt ?? false,
    };

    logger.debug({ ...result }, "SMS pool read");
    return result;
  }

  public async addTopupSmsCredits(amount: number): Promise<void> {
    const logger = this.loggerFactory("addTopupSmsCredits");
    logger.debug({ amount }, "Adding topup credits");

    assertNonNegInt(amount, "amount");
    if (amount === 0) {
      logger.debug("Amount is 0; skipping topup");
      return;
    }

    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );

    await collection.updateOne(
      { _id: this.organizationId },
      { $inc: { "smsBalance.topup": amount } },
    );

    await this.eventService.emit(
      SMS_TOPUP_PURCHASED_EVENT_TYPE,
      { credits: amount },
      systemEventSource,
    );

    logger.debug({ amount }, "Topup added");
  }

  public async setIncludedSmsCredits(amount: number): Promise<void> {
    const logger = this.loggerFactory("setIncludedSmsCredits");
    logger.debug({ amount }, "Setting included credits");
    assertNonNegInt(amount, "amount");

    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    await collection.updateOne(
      { _id: this.organizationId },
      { $set: { "smsBalance.included": amount } },
    );

    logger.debug({ amount }, "Included credits set");
  }

  private async consumePoolsInDb(
    amount: number,
  ): Promise<{ previousTotal: number; newTotal: number }> {
    const logger = this.loggerFactory("consumePoolsInDb");
    logger.debug({ amount }, "Consuming SMS credits");

    assertNonNegInt(amount, "amount");
    const { included, topup, feesExempt } = await this.getSmsCreditBalance();

    if (feesExempt === true) {
      logger.debug("Fees exempt; skipping SMS balance consumption");
      return { previousTotal: 0, newTotal: 0 };
    }

    if (amount > included + topup) {
      logger.debug(
        "Insufficient SMS balance; skipping SMS balance consumption",
      );

      throw new SmsCreditsExhaustedError();
    }

    try {
      const db = await getDbConnection();
      const collection = db.collection<Organization>(
        ORGANIZATIONS_COLLECTION_NAME,
      );

      const deductFromIncluded = Math.min(included, amount);
      const deductFromTopup = amount - deductFromIncluded;

      logger.debug(
        { deductFromIncluded, deductFromTopup },
        "Deducting from SMS balance",
      );

      await collection.updateOne(
        { _id: this.organizationId },
        {
          $inc: {
            "smsBalance.included": -deductFromIncluded,
            "smsBalance.topup": -deductFromTopup,
          },
        },
      );

      return {
        previousTotal: included + topup,
        newTotal: included - deductFromIncluded + (topup - deductFromTopup),
      };
    } catch (error) {
      logger.warn({ error }, "SMS balance transaction failed");
      throw error;
    }
  }

  public async getCurrentSmsBalanceTotal(): Promise<number | null> {
    const logger = this.loggerFactory("getCurrentSmsBalanceTotal");
    logger.debug("Getting current SMS balance total");
    const { included, topup, feesExempt } = await this.getSmsCreditBalance();
    if (feesExempt === true) {
      logger.debug("Fees exempt; skipping SMS balance total read");
      return null;
    }

    const total = included + topup;
    logger.debug({ total }, "Current SMS balance total");
    return total;
  }

  public async consumeSmsCredits(input: BillingConsumeSmsInput): Promise<void> {
    const logger = this.loggerFactory("consumeSmsCredits");
    logger.debug({ input }, "Consuming SMS credits");
    const organization = await this.organizationService.getOrganization();
    if (organization?.feesExempt === true) {
      logger.debug("Fees exempt; skipping SMS balance consumption");
      return;
    }

    const amount = Math.trunc(input.amount);
    if (amount < 0 || !Number.isFinite(amount)) {
      logger.warn(
        { amount },
        "Invalid amount; skipping SMS balance consumption",
      );
      return;
    }

    if (amount === 0) {
      logger.debug("Amount is 0; skipping SMS balance consumption");
      return;
    }

    const { previousTotal, newTotal } = await this.consumePoolsInDb(amount);

    const eventName = this.polar.config.smsUsageEventName.trim();
    if (this.polar.client && eventName) {
      const extBase = input.textId?.trim()
        ? `sms_${input.direction}_${input.textId}`
        : `sms_${input.direction}`;

      try {
        const events: Array<{
          name: string;
          externalCustomerId: string;
          externalId?: string;
          metadata: Record<string, string>;
        }> = [];
        for (let i = 0; i < amount; i++) {
          const externalId = amount > 1 ? `${extBase}_${i}` : extBase;
          events.push({
            name: eventName,
            externalCustomerId: this.organizationId,
            externalId,
            metadata: {
              direction: input.direction,
              organization_id: this.organizationId,
            },
          });
        }
        await this.polar.ingestMeteredEvents(events);
      } catch (error) {
        logger.warn({ error }, "Polar SMS usage event ingest failed");
      }
    }

    await maybeEmitSmsCreditThresholdEvent({
      eventService: this.eventService,
      previousBalance: previousTotal,
      newBalance: newTotal,
    });
  }

  public async recordSmsCreditUsage(
    input: BillingRecordSmsUsageInput,
  ): Promise<void> {
    await this.consumeSmsCredits({ ...input, amount: 1 });
  }

  private seatsBenefitFromOrg(
    org: Organization | null | undefined,
    addons: OrganizationBillingSeatAddonSubscription[] = [],
  ): OrganizationBillingSeatsBenefit | null {
    if (!org || org.feesExempt === true) return null;
    const included = Math.max(0, org.userSlots?.included ?? 1);
    const additional = Math.max(0, org.userSlots?.additional ?? 0);
    const available = Math.max(
      0,
      org.availableUsers ?? included + additional,
    );
    return {
      included,
      additional,
      available,
      allowAdditionalUsers: org.allowAdditionalUsers === true,
      addons,
    };
  }

  private async loadSeatAddonSubscriptions(
    org: Organization | null | undefined,
  ): Promise<OrganizationBillingSeatAddonSubscription[]> {
    const logger = this.loggerFactory("loadSeatAddonSubscriptions");
    const grants =
      org?.userSlotGrants?.filter((g) => g.source === "addon") ?? [];
    if (!grants.length || !this.polar.client) {
      return grants.map((g) => ({
        subscriptionId: g.polarSubscriptionId,
        name: null,
        usersAmount: Math.max(0, g.usersAmount),
        price: null,
        status: null,
        nextCycleDate: null,
      }));
    }

    const results = await Promise.all(
      grants.map(async (grant) => {
        const base: OrganizationBillingSeatAddonSubscription = {
          subscriptionId: grant.polarSubscriptionId,
          name: null,
          usersAmount: Math.max(0, grant.usersAmount),
          price: null,
          status: null,
          nextCycleDate: null,
        };
        try {
          const subscription = await this.polar.getSubscriptionById(
            grant.polarSubscriptionId,
          );
          const price: BillingSubscriptionPrice = {
            amountCents: subscription.amount,
            currency: subscription.currency,
            recurringInterval:
              (subscription.recurringInterval as BillingInterval) ?? null,
          };
          return {
            ...base,
            name: subscription.product?.name ?? null,
            price,
            status: parseOrganizationSubscriptionStatus(subscription.status),
            nextCycleDate: subscription.currentPeriodEnd ?? null,
          };
        } catch (error) {
          logger.debug(
            { error, subscriptionId: grant.polarSubscriptionId },
            "Could not load seat-addon subscription details",
          );
          return base;
        }
      }),
    );

    return results;
  }

  public async getSubscriptionDetails(): Promise<OrganizationBillingSubscriptionDetails> {
    const logger = this.loggerFactory("getSubscriptionDetails");
    logger.debug("Getting subscription details");
    const org = await this.organizationService.getOrganization();
    const feesExempt = org?.feesExempt === true;
    const subscriptionId = org?.polarSubscriptionId?.trim() ?? null;
    const statusFromDb = org?.polarSubscriptionStatus ?? null;

    const empty = async (): Promise<OrganizationBillingSubscriptionDetails> => {
      const addons = feesExempt
        ? []
        : await this.loadSeatAddonSubscriptions(org);
      return {
        feesExempt,
        planTier: resolvePlanTierFromProductId(
          org?.polarSubscriptionProductId,
          { feesExempt },
        ),
        subscriptionId,
        subscriptionName: null,
        status: statusFromDb,
        subscriptionPrice: null,
        currentPeriodStart: null,
        nextCycleDate: null,
        benefits: {
          sms: null,
          seats: this.seatsBenefitFromOrg(org, addons),
        },
      };
    };

    if (feesExempt) {
      logger.debug("Fees exempt; skipping subscription details");
      return empty();
    }

    if (!this.polar.client || !subscriptionId) {
      logger.debug(
        "No Polar client or subscription ID; skipping subscription details",
      );
      return empty();
    }

    try {
      logger.debug("Getting Polar subscription");
      const subscription = await this.polar.getSubscriptionById(subscriptionId);
      const subscriptionPrice = {
        amountCents: subscription.amount,
        currency: subscription.currency,
        recurringInterval: subscription.recurringInterval as BillingInterval,
      };

      const subscriptionName = subscription.product?.name ?? null;
      const status = parseOrganizationSubscriptionStatus(subscription.status);
      const nextCycleEnd = subscription.currentPeriodEnd ?? null;
      const currentPeriodStart = subscription.currentPeriodStart ?? null;
      const { included, topup } = await this.getSmsCreditBalance();

      const meterId = this.polar.config.smsCreditsMeterId?.trim() ?? "";
      const productId =
        subscription.product?.id?.trim() ??
        (
          subscription as { productId?: string | null | undefined }
        ).productId?.trim() ??
        null;

      let includedPerCycle: number | null = meterCreditUnitsForMeter(
        subscription.product,
        meterId,
      );

      logger.debug({ includedPerCycle }, "SMS credits included per cycle");

      if (
        includedPerCycle === null &&
        productId &&
        meterId &&
        this.polar.client
      ) {
        try {
          logger.debug(
            { productId },
            "Loading Polar product for per-cycle SMS credits",
          );

          const product = await this.polar.client.products.get({
            id: productId,
          });

          includedPerCycle = meterCreditUnitsForMeter(product, meterId);

          logger.debug(
            { includedPerCycle },
            "Loaded Polar product for per-cycle SMS credits",
          );
        } catch (err) {
          logger.debug(
            { err, productId },
            "Could not load Polar product for per-cycle SMS credits",
          );
        }
      }

      const sms: OrganizationBillingSubscriptionDetails["benefits"]["sms"] = {
        included: included ?? 0,
        topup: topup ?? 0,
        nextRefreshDate: nextCycleEnd,
        includedPerCycle,
      };

      const seatAddons = await this.loadSeatAddonSubscriptions(org);
      const seats = this.seatsBenefitFromOrg(org, seatAddons);

      logger.debug(
        {
          subscriptionName,
          status,
          nextCycleEnd,
          included,
          topup,
          includedPerCycle,
          seats,
        },
        "Retrieved subscription details",
      );

      return {
        feesExempt: false,
        planTier: resolvePlanTierFromProductId(productId, { feesExempt: false }),
        subscriptionId,
        subscriptionName,
        status,
        subscriptionPrice,
        currentPeriodStart,
        nextCycleDate: nextCycleEnd,
        benefits: { sms, seats },
      };
    } catch (error) {
      logger.warn(
        { error },
        "Could not load Polar subscription for billing details",
      );

      return empty();
    }
  }

  public async getBillingPeriod(): Promise<BillingPeriod | null> {
    const org = await this.organizationService.getOrganization();
    if (org?.feesExempt === true) return null;

    const subscriptionId = org?.polarSubscriptionId?.trim();
    if (!this.polar.client || !subscriptionId) return null;

    try {
      const subscription = await this.polar.getSubscriptionById(subscriptionId);
      const start = subscription.currentPeriodStart;
      const end = subscription.currentPeriodEnd;
      if (!start || !end) return null;
      return { start, end };
    } catch {
      return null;
    }
  }

  public async recomputeAvailableUsers(): Promise<number> {
    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const org = await collection.findOne({ _id: this.organizationId });
    const grants = org?.userSlotGrants ?? [];
    const planGrant = grants.find((g) => g.source === "plan");
    const addonSum = grants
      .filter((g) => g.source === "addon")
      .reduce((sum, g) => sum + Math.max(0, g.usersAmount), 0);
    const included = Math.max(
      0,
      planGrant?.usersAmount ?? org?.userSlots?.included ?? 1,
    );
    const additional = Math.max(0, addonSum);
    const availableUsers = included + additional;

    await collection.updateOne(
      { _id: this.organizationId },
      {
        $set: {
          userSlots: { included, additional },
          availableUsers,
        },
      },
    );

    return availableUsers;
  }

  public async setIncludedUserSlots(
    amount: number,
    options?: {
      polarSubscriptionId?: string;
      allowAdditionalUsers?: boolean;
    },
  ): Promise<void> {
    const logger = this.loggerFactory("setIncludedUserSlots");
    assertNonNegInt(amount, "amount");
    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const org = await collection.findOne({ _id: this.organizationId });
    let grants = [...(org?.userSlotGrants ?? [])].filter(
      (g) => g.source !== "plan",
    );
    const planSubId =
      options?.polarSubscriptionId ??
      org?.userSlotGrants?.find((g) => g.source === "plan")
        ?.polarSubscriptionId ??
      org?.polarSubscriptionId ??
      "plan";
    grants.push({
      polarSubscriptionId: planSubId,
      usersAmount: amount,
      source: "plan",
    });

    await collection.updateOne(
      { _id: this.organizationId },
      {
        $set: {
          userSlotGrants: grants,
          "userSlots.included": amount,
          ...(options?.allowAdditionalUsers !== undefined
            ? { allowAdditionalUsers: options.allowAdditionalUsers }
            : {}),
        },
      },
    );

    await this.recomputeAvailableUsers();
    logger.debug({ amount }, "Included user slots set");
  }

  public async upsertUserSlotGrant(grant: {
    polarSubscriptionId: string;
    usersAmount: number;
    source: "plan" | "addon";
  }): Promise<void> {
    assertNonNegInt(grant.usersAmount, "usersAmount");
    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const org = await collection.findOne({ _id: this.organizationId });
    const grants = [...(org?.userSlotGrants ?? [])].filter(
      (g) => g.polarSubscriptionId !== grant.polarSubscriptionId,
    );
    grants.push(grant);
    await collection.updateOne(
      { _id: this.organizationId },
      { $set: { userSlotGrants: grants } },
    );
    await this.recomputeAvailableUsers();
  }

  public async removeUserSlotGrant(
    polarSubscriptionId: string,
  ): Promise<void> {
    const db = await getDbConnection();
    const collection = db.collection<Organization>(
      ORGANIZATIONS_COLLECTION_NAME,
    );
    const org = await collection.findOne({ _id: this.organizationId });
    const grants = (org?.userSlotGrants ?? []).filter(
      (g) => g.polarSubscriptionId !== polarSubscriptionId,
    );
    await collection.updateOne(
      { _id: this.organizationId },
      { $set: { userSlotGrants: grants } },
    );
    await this.recomputeAvailableUsers();
  }
}
