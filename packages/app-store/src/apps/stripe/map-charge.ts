import { PaymentFee } from "@hacado/types";
import { round2 } from "@hacado/utils";
import type Stripe from "stripe";

type StripeChargeWithTip = Stripe.Charge & {
  amount_details?: { tip?: { amount?: number } };
};

export type StripeInStoreChargeInput = {
  chargeId: string;
  amount: number;
  currency: string;
  transactionTime: Date;
  fees?: PaymentFee[];
  providerSplit?: { paymentAmount: number; tip: number };
  raw?: unknown;
};

export function isHacadoCheckoutPaymentIntent(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  if (!metadata) {
    return false;
  }
  const orgId = metadata.organizationId;
  const hacadoIntentId = metadata.hacadoIntentId ?? undefined;
  return Boolean(orgId && hacadoIntentId);
}

export function feesFromStripeCharge(ch: Stripe.Charge): PaymentFee[] {
  const bt = ch.balance_transaction;
  if (bt == null || typeof bt === "string") {
    return [];
  }
  const feeCents = bt.fee;
  if (feeCents == null || feeCents <= 0) {
    return [];
  }
  return [{ type: "transaction", amount: feeCents / 100 }];
}

export function extractTipFromStripeCharge(
  charge: StripeChargeWithTip,
  grossAmount: number,
): { paymentAmount: number; tip: number } | undefined {
  const tipMinor = charge.amount_details?.tip?.amount;
  if (tipMinor == null || tipMinor <= 0) {
    return undefined;
  }

  const tip = round2(tipMinor / 100);
  const amount = round2(grossAmount);
  if (tip <= 0 || tip >= amount) {
    return undefined;
  }

  return { paymentAmount: round2(amount - tip), tip };
}

export function mapStripeChargeToIngestInput(
  charge: StripeChargeWithTip,
): StripeInStoreChargeInput | null {
  if (charge.status !== "succeeded") {
    return null;
  }

  const amount = charge.amount / 100;
  if (amount <= 0) {
    return null;
  }

  return {
    chargeId: charge.id,
    amount,
    currency: charge.currency.toUpperCase(),
    transactionTime: new Date(charge.created * 1000),
    fees: feesFromStripeCharge(charge),
    providerSplit: extractTipFromStripeCharge(charge, amount),
    raw: charge,
  };
}
