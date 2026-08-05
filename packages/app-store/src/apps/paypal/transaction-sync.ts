import { LoggerFactory } from "@hacado/logger";
import { ConnectedAppData, PaymentFee } from "@hacado/types";
import { round2 } from "@hacado/utils";
import { PaypalClient, PaypalTransactionDetail } from "./client";
import { PAYPAL_TRANSACTION_SYNC_LOOKBACK_SECONDS } from "./const";
import { PaypalConfiguration } from "./models";
import { OrdersCapture, CaptureStatus } from "./types";

export type InStoreCaptureInput = {
  /** PayPal capture id — stored as payment / synced-payment externalId. */
  captureId: string;
  /** Checkout order id when present; used for legacy dedup and fee lookup only. */
  orderId?: string;
  amount: number;
  currency: string;
  transactionTime: Date;
  fees?: PaymentFee[];
  breakdown?: unknown;
  raw?: unknown;
  providerSplit?: { paymentAmount: number; tip: number };
};

export type InStoreCaptureIngestResult =
  | "ingested"
  | "skipped"
  | "already_exists";

export type PaypalTransactionSyncDeps = {
  appData: ConnectedAppData<PaypalConfiguration>;
  client: PaypalClient;
  ingest: (capture: InStoreCaptureInput) => Promise<InStoreCaptureIngestResult>;
  logger: ReturnType<LoggerFactory>;
};

export function computeSyncWindow(now: Date): { start: Date; end: Date } {
  const end = now;
  const start = new Date(
    end.getTime() - PAYPAL_TRANSACTION_SYNC_LOOKBACK_SECONDS * 1000,
  );
  return { start, end };
}

/**
 * Derives payment vs tip from PayPal cart line items when cart_info is present.
 * Payment amount is the sum of item totals; any remainder of the transaction
 * gross is treated as tip (e.g. an explicit tip or gratuity line not in cart).
 */
export function extractCartSplit(
  detail: PaypalTransactionDetail,
  transactionAmount: number,
): { paymentAmount: number; tip: number } | undefined {
  const items = detail.cart_info?.item_details;
  if (!items?.length) {
    return undefined;
  }

  let cartTotal = 0;
  for (const item of items) {
    const itemTotal = parseFloat(item.total_item_amount?.value ?? "");
    if (!Number.isFinite(itemTotal) || itemTotal < 0) {
      return undefined;
    }
    cartTotal += itemTotal;
  }

  cartTotal = round2(cartTotal);
  const amount = round2(transactionAmount);

  if (cartTotal <= 0 || cartTotal > amount) {
    return undefined;
  }

  const tip = round2(amount - cartTotal);
  if (tip < 0) {
    return undefined;
  }

  if (Math.abs(cartTotal + tip - amount) > 0.01) {
    return undefined;
  }

  return { paymentAmount: cartTotal, tip };
}

export function getTransactionCaptureId(
  detail: PaypalTransactionDetail,
): string | null {
  return detail.transaction_info?.transaction_id ?? null;
}

export function extractOrderIdFromCapture(
  capture: OrdersCapture,
): string | undefined {
  const orderId = capture.supplementary_data?.related_ids?.order_id;
  if (orderId) {
    return orderId;
  }

  const upHref = capture.links?.find((link) => link.rel === "up")?.href;
  if (!upHref) {
    return undefined;
  }

  const match = upHref.match(/\/v2\/checkout\/orders\/([^/?]+)/i);
  return match?.[1];
}

/**
 * Builds ingest input from a verified PayPal capture. The transaction list is
 * only used to discover capture ids and optional cart_info for tip splitting.
 */
export function mapVerifiedCaptureToIngestInput(
  capture: OrdersCapture,
  listDetail?: PaypalTransactionDetail,
): InStoreCaptureInput | null {
  const captureId = capture.id;
  if (!captureId) {
    return null;
  }

  if (
    capture.status &&
    capture.status !== CaptureStatus.Completed &&
    capture.status !== CaptureStatus.PartiallyRefunded
  ) {
    return null;
  }

  const amount = parseFloat(capture.amount?.value ?? "") || 0;
  const currency = capture.amount?.currency_code;
  if (!currency || amount <= 0) {
    return null;
  }

  const transactionTime = capture.create_time
    ? new Date(capture.create_time)
    : new Date();

  const providerSplit =
    listDetail !== undefined
      ? extractCartSplit(listDetail, amount)
      : undefined;

  return {
    captureId,
    orderId: extractOrderIdFromCapture(capture),
    amount,
    currency,
    transactionTime,
    breakdown: capture.seller_receivable_breakdown,
    providerSplit,
    raw: {
      capture,
      listDetail,
    },
  };
}

export async function runPaypalTransactionSync(
  deps: PaypalTransactionSyncDeps,
): Promise<void> {
  const { appData, client, ingest, logger } = deps;
  const now = new Date();
  const { start, end } = computeSyncWindow(now);

  logger.debug(
    { appId: appData._id, start, end },
    "Polling PayPal transactions",
  );

  const result = await client.listAllTransactions(start, end);
  if (result.error) {
    logger.warn(
      {
        appId: appData._id,
        statusCode: result.error.statusCode,
        start,
        end,
      },
      "Failed to list PayPal transactions",
    );
    throw new Error(
      `PayPal transaction list failed with status ${result.error.statusCode ?? "unknown"}`,
    );
  }

  let ingested = 0;
  let skipped = 0;
  let alreadyExists = 0;
  let phantom = 0;

  for (const detail of result.transactionDetails) {
    logger.debug(
      { id: detail.transaction_info?.transaction_id },
      "Processing PayPal transaction",
    );
    const captureId = getTransactionCaptureId(detail);
    if (!captureId) {
      logger.debug(
        { id: detail.transaction_info?.transaction_id },
        "Skipping PayPal transaction (missing capture id)",
      );

      skipped += 1;
      continue;
    }

    const { capture: verifiedCapture, error: captureError } =
      await client.getCapture(captureId);

    if (!verifiedCapture) {
      phantom += 1;
      logger.debug(
        {
          appId: appData._id,
          captureId,
          statusCode: captureError?.statusCode,
        },
        captureError?.statusCode === 404
          ? "Skipping phantom PayPal transaction (capture not found)"
          : "Skipping PayPal transaction (capture lookup failed)",
      );
      continue;
    }

    const capture = mapVerifiedCaptureToIngestInput(verifiedCapture, detail);
    if (!capture) {
      logger.debug(
        { captureId, status: verifiedCapture.status },
        "Skipping PayPal transaction (invalid or non-completed capture)",
      );

      skipped += 1;
      continue;
    }

    const outcome = await ingest(capture);
    if (outcome === "ingested") {
      logger.debug(
        { id: detail.transaction_info?.transaction_id },
        "Successfully ingested PayPal transaction",
      );

      ingested += 1;
    } else if (outcome === "already_exists") {
      logger.debug(
        { id: detail.transaction_info?.transaction_id },
        "Skipping PayPal transaction (already ingested)",
      );

      alreadyExists += 1;
    } else {
      logger.debug(
        { id: detail.transaction_info?.transaction_id },
        "Skipping PayPal transaction (ingestion failed)",
      );

      skipped += 1;
    }
  }

  logger.info(
    {
      appId: appData._id,
      total: result.transactionDetails.length,
      ingested,
      skipped,
      phantom,
      alreadyExists,
      start,
      end,
    },
    "Completed PayPal transaction sync poll",
  );
}
