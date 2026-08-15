import { Prettify } from "../utils";

export type BillingRecordSmsUsageInput = {
  direction: "inbound" | "outbound";
  textId?: string;
};

export type BillingConsumeSmsInput = BillingRecordSmsUsageInput & {
  /** Units to consume (e.g. 1 per message). */
  amount: number;
};

/** SMS credits on the subscription period plus optional purchased top-up pool. */
export type OrganizationBillingSmsBenefit = {
  included: number;
  topup: number;
  nextRefreshDate: Date | null;
  /**
   * SMS units granted each billing period from the subscribed product’s `meter_credit`
   * (same source as `setIncludedSmsCredits` on renewals). `null` if unknown.
   */
  includedPerCycle: number | null;
};

export type SmsCreditsState = Prettify<
  | { feesExempt: false; included: number; topup: number }
  | { feesExempt: true; included?: number; topup?: number }
>;

export class SmsCreditsExhaustedError extends Error {
  readonly code = "sms_credits_exhausted" as const;

  constructor(
    message = "SMS subscription credits are exhausted. Add credits or upgrade your plan.",
  ) {
    super(message);
    this.name = "SmsCreditsExhaustedError";
  }
}
