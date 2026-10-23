import { getLoggerFactory } from "@hacado/logger";
import {
  BillingPlanTier,
  meetsMinimumPlanTier,
  OrganizationSubscriptionStatus,
  SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
  type SubscriptionStatusChangedPayload,
} from "@hacado/types";
import { SmsRegistrationStore } from "../../text-message/registration-store";
import { claimEventHandler } from "../claim-event-handler";
import type { EventHandler } from "./types";

const belowSolo = (tier: BillingPlanTier | null | undefined) => {
  if (!tier) return false;
  return !meetsMinimumPlanTier(tier, BillingPlanTier.Solo);
};

export const smsProfileNumberHandler: EventHandler = {
  name: "sms-profile-number",
  async run({ envelope, redis }) {
    if (envelope.type !== SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE) return;

    const payload = envelope.payload as SubscriptionStatusChangedPayload;
    const canceled =
      payload.newStatus === OrganizationSubscriptionStatus.Canceled;

    if (!canceled && !belowSolo(payload.newTier)) return;

    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "sms-profile-number",
    );

    if (!claimed) return;

    const logger = getLoggerFactory("Events/SmsProfileNumber")("run");
    await new SmsRegistrationStore().releaseOrganizationNumber(
      envelope.organizationId,
    );

    logger.info(
      { organizationId: envelope.organizationId, status: payload.newStatus },
      "Released custom SMS number",
    );
  },
};
