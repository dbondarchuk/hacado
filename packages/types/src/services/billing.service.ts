import {
  BillingConsumeSmsInput,
  BillingRecordSmsUsageInput,
  SmsCreditsState,
} from "../billing/sms";
import {
  BillingPeriod,
  OrganizationBillingSubscriptionDetails,
} from "../billing/subscription-details";

export interface IBillingService {
  getSmsCreditBalance(): Promise<SmsCreditsState>;

  /** Sum of `included` + `topup` in DB; `null` when fees-exempt. */
  getCurrentSmsBalanceTotal(): Promise<number | null>;

  /**
   * Decrements DB pools (included first), ingests usage to Polar, may emit low/exhausted events.
   */
  consumeSmsCredits(input: BillingConsumeSmsInput): Promise<void>;

  addTopupSmsCredits(amount: number): Promise<void>;

  setIncludedSmsCredits(amount: number): Promise<void>;

  /** @deprecated Use `consumeSmsCredits` with `amount: 1`. */
  recordSmsCreditUsage(input: BillingRecordSmsUsageInput): Promise<void>;

  getSubscriptionDetails(): Promise<OrganizationBillingSubscriptionDetails>;

  /** Current Polar subscription billing period, when available. */
  getBillingPeriod(): Promise<BillingPeriod | null>;

  /** Set plan-included user seats from Polar product metadata. */
  setIncludedUserSlots(
    amount: number,
    options?: {
      polarSubscriptionId?: string;
      allowAdditionalUsers?: boolean;
    },
  ): Promise<void>;

  /** Upsert or replace a recurring seat-addon grant and recompute totals. */
  upsertUserSlotGrant(grant: {
    polarSubscriptionId: string;
    usersAmount: number;
    source: "plan" | "addon";
  }): Promise<void>;

  /** Remove a seat grant (cancel/revoke) and recompute totals. */
  removeUserSlotGrant(polarSubscriptionId: string): Promise<void>;

  /** Recompute availableUsers from userSlots + grants. */
  recomputeAvailableUsers(): Promise<number>;
}
