import {
  InStorePaymentUpdateModel,
  Payment,
  PaymentSummary,
  WithTotal,
} from "@hacado/types";
import {
  CreatePaymentLinkBody,
  RefundPayments,
  ResendPaymentLinkBody,
} from "../schemas/payments";
import {
  PaymentsSearchParams,
  paymentsSearchParamsSerializer,
} from "../search-params/payments";
import { BASE_ADMIN_API_URL, fetchAdminApi } from "./utils";

export type ListPaymentsParams = PaymentsSearchParams;

export class PaymentsExportError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly body?: {
      code?: string;
      message?: string;
      limit?: number;
      count?: number;
    },
  ) {
    super(message);
    this.name = "PaymentsExportError";
  }
}

function parseContentDispositionFilename(
  disposition: string | null,
): string | undefined {
  if (!disposition) {
    return undefined;
  }

  const match = disposition.match(/filename="([^"]+)"/);
  return match?.[1];
}

export const listPayments = async (params: ListPaymentsParams = {}) => {
  const serializedParams = paymentsSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/payments${serializedParams}`);
  return response.json<WithTotal<PaymentSummary>>();
};

export const exportPayments = async (params: ListPaymentsParams = {}) => {
  const { page: _page, limit: _limit, ...filterParams } = params;
  const serializedParams = paymentsSearchParamsSerializer(filterParams);
  const response = await fetch(
    `${BASE_ADMIN_API_URL}/payments/export${serializedParams}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new PaymentsExportError(
      body?.message ?? "Failed to export payments",
      response.status,
      body,
    );
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ) ?? `payments-${new Date().toISOString().slice(0, 10)}.csv`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

export const getPayment = async (id: string) => {
  console.debug({ paymentId: id }, "Getting payment");

  const response = await fetchAdminApi(`/payments/${id}`);
  const result = await response.json<Payment>();

  console.debug("Payment retrieved successfully", {
    paymentId: result._id,
  });

  return result;
};

export const deleteInstore = async (id: string) => {
  console.debug({ paymentId: id }, "Deleting payment");

  const response = await fetchAdminApi(`/payments/instore/${id}`, {
    method: "DELETE",
  });

  const result = await response.json<Payment>();

  console.debug("In-store appointment payment deleted successfully", {
    paymentId: result._id,
  });

  return result;
};

export const addInstore = async (payment: InStorePaymentUpdateModel) => {
  console.debug({ payment }, "Adding in-store appointment payment");

  const response = await fetchAdminApi("/payments/instore", {
    method: "POST",
    body: JSON.stringify(payment),
  });

  const result = await response.json<Payment>();

  console.debug("In-store appointment payment added successfully", {
    paymentId: result._id,
  });

  return result;
};

export const updateInstore = async (
  id: string,
  update: InStorePaymentUpdateModel,
) => {
  console.debug(
    { appointmentId: id, update },
    "Updating in-store appointment payment",
  );

  const response = await fetchAdminApi(`/payments/instore/${id}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });

  const result = await response.json<Payment>();

  console.debug("In-store appointment payment updated successfully", {
    paymentId: result._id,
  });

  return result;
};

export const refundPayments = async (refunds: RefundPayments) => {
  console.debug("Refunding payments", { refunds });

  const response = await fetchAdminApi("/payments/refund", {
    method: "POST",
    body: JSON.stringify(refunds),
  });

  const result = await response.json<{
    success: boolean;
    updatedPayments: Record<string, Payment>;
    errors: Record<string, string>;
  }>();

  console.debug("Payments refunded successfully", {
    success: result.success,
    errors: result.errors,
  });

  return result;
};

export const refundPayment = async (id: string, amount: number) => {
  console.debug("Refunding payment", { id, amount });

  const response = await fetchAdminApi(`/payments/${id}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

  const result = await response.json<{
    success: boolean;
    payment: Payment;
    error: string;
  }>();

  console.debug("Payment refunded successfully", {
    success: result.success,
    error: result.error,
  });

  return result;
};

export const listPaymentLinkApps = async () => {
  const response = await fetchAdminApi("/payments/payment-link/apps");
  return response.json<{ items: { _id: string; name: string }[] }>();
};

export const createPaymentLink = async (body: CreatePaymentLinkBody) => {
  console.debug({ body }, "Creating payment link");

  const response = await fetchAdminApi("/payments/payment-link", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const result = await response.json<{ payment: Payment; url: string }>();

  console.debug("Payment link created successfully", {
    paymentId: result.payment._id,
  });

  return result;
};

export const resendPaymentLink = async (
  id: string,
  body: ResendPaymentLinkBody,
) => {
  console.debug({ paymentId: id, body }, "Resending payment link");

  const response = await fetchAdminApi(`/payments/${id}/payment-link/resend`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const result = await response.json<{ payment: Payment }>();

  console.debug("Payment link resent successfully", {
    paymentId: result.payment._id,
  });

  return result;
};

export const cancelPaymentLink = async (id: string) => {
  console.debug({ paymentId: id }, "Cancelling payment link");

  const response = await fetchAdminApi(`/payments/${id}/payment-link/cancel`, {
    method: "POST",
  });

  const result = await response.json<Payment>();

  console.debug("Payment link cancelled successfully", {
    paymentId: result._id,
  });

  return result;
};

export const getPaymentLinkUrl = async (id: string) => {
  console.debug({ paymentId: id }, "Getting payment link URL");

  const response = await fetchAdminApi(`/payments/${id}/payment-link/url`);
  const result = await response.json<{ url: string }>();

  console.debug("Payment link URL retrieved successfully", {
    paymentId: id,
  });

  return result;
};
