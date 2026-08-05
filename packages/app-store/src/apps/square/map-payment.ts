import { PaymentFee } from "@hacado/types";
import { round2 } from "@hacado/utils";

export type SquareMoney = {
  amount?: bigint | number | string;
  currency?: string;
};

export type SquarePaymentForSync = {
  id?: string;
  order_id?: string;
  status?: string;
  amount_money?: SquareMoney;
  created_at?: string;
  processing_fee?: Array<{
    amount_money?: SquareMoney;
    type?: string;
  }>;
};

export type SquareOrderForSync = {
  line_items?: Array<{
    total_money?: SquareMoney;
    base_price_money?: SquareMoney;
    quantity?: string;
  }>;
};

export type SquareInStorePaymentInput = {
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  transactionTime: Date;
  fees?: PaymentFee[];
  providerSplit?: { paymentAmount: number; tip: number };
  raw?: unknown;
};

export function squareMinorToAmount(
  raw: bigint | number | string | undefined,
): number {
  if (raw == null) {
    return 0;
  }
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return n / 100;
}

export function isCompletedSquarePayment(
  payment: SquarePaymentForSync,
): boolean {
  return payment.status === "COMPLETED";
}

export function processingFeesFromSquarePayment(
  payment: SquarePaymentForSync,
): PaymentFee[] {
  if (!payment.processing_fee?.length) {
    return [];
  }

  let totalMinor = 0;
  for (const fee of payment.processing_fee) {
    const raw = fee.amount_money?.amount;
    if (raw == null) {
      continue;
    }
    const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
    if (Number.isNaN(n) || n <= 0) {
      continue;
    }
    totalMinor += n;
  }

  if (totalMinor <= 0) {
    return [];
  }

  return [{ type: "transaction", amount: totalMinor / 100 }];
}

/**
 * Derives payment vs tip from Square order line items when present.
 * Any remainder of the payment gross is treated as tip.
 */
export function extractOrderSplit(
  order: SquareOrderForSync | null | undefined,
  grossAmount: number,
): { paymentAmount: number; tip: number } | undefined {
  const items = order?.line_items;
  if (!items?.length) {
    return undefined;
  }

  let lineTotal = 0;
  for (const item of items) {
    const raw =
      item.total_money?.amount ??
      (item.base_price_money?.amount != null
        ? Number(item.base_price_money.amount) *
          Number(item.quantity ?? "1")
        : undefined);
    if (raw == null) {
      return undefined;
    }
    const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      return undefined;
    }
    lineTotal += n;
  }

  lineTotal = round2(lineTotal / 100);
  const amount = round2(grossAmount);
  if (lineTotal <= 0 || lineTotal > amount) {
    return undefined;
  }

  const tip = round2(amount - lineTotal);
  if (tip < 0) {
    return undefined;
  }

  return { paymentAmount: lineTotal, tip };
}

export function mapSquarePaymentToIngestInput(
  payment: SquarePaymentForSync,
  order?: SquareOrderForSync | null,
): SquareInStorePaymentInput | null {
  const paymentId = payment.id;
  if (!paymentId || !isCompletedSquarePayment(payment)) {
    return null;
  }

  const amount = squareMinorToAmount(payment.amount_money?.amount);
  if (amount <= 0) {
    return null;
  }

  const currency = payment.amount_money?.currency?.toUpperCase() ?? "";
  const transactionTime = payment.created_at
    ? new Date(payment.created_at)
    : new Date();

  return {
    paymentId,
    orderId: payment.order_id,
    amount,
    currency,
    transactionTime,
    fees: processingFeesFromSquarePayment(payment),
    providerSplit: extractOrderSplit(order, amount),
    raw: order ? { payment, order } : { payment },
  };
}
