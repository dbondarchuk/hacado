import { getLoggerFactory } from "@hacado/logger";
import {
  BillingPlanTier,
  meetsMinimumPlanTier,
  OrganizationSubscriptionStatus,
} from "@hacado/types/billing";
import type { SubscriptionStatusChangedPayload } from "@hacado/types/events";
import { SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE } from "@hacado/types/events";
import { Telnyx } from "telnyx";
import { getTelnyxConfiguration } from "../../text-message/telnyx/config";
import { releaseDedicatedNumberForOrganization } from "../../text-message/telnyx/org-messaging-profile";
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
    const apiKey = getTelnyxConfiguration().apiKey;
    await releaseDedicatedNumberForOrganization({
      organizationId: envelope.organizationId,
      ...(apiKey ? { client: new Telnyx({ apiKey }) } : {}),
    });

    logger.info(
      { organizationId: envelope.organizationId, status: payload.newStatus },
      "Released custom SMS number",
    );
  },
};
