import {
  HydratedSyncedPayment,
  SyncedPayment,
  SyncedPaymentAssignablePaymentType,
  SyncedPaymentStatus,
  WithTotal,
} from "@hacado/types";
import { fetchAdminApi } from "./utils";

export const listSyncedPayments = async (params?: {
  status?: SyncedPaymentStatus[];
  limit?: number;
  offset?: number;
  start?: Date;
  end?: Date;
  externalId?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.status?.length) {
    searchParams.set("status", params.status.join(","));
  }
  if (params?.externalId) {
    searchParams.set("externalId", params.externalId);
  }
  if (params?.limit != null) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset != null) {
    searchParams.set("offset", String(params.offset));
  }
  if (params?.start) {
    searchParams.set("start", params.start.toISOString());
  }
  if (params?.end) {
    searchParams.set("end", params.end.toISOString());
  }

  const query = searchParams.toString();
  const response = await fetchAdminApi(
    `/synced-payments${query ? `?${query}` : ""}`,
  );

  return response.json<WithTotal<HydratedSyncedPayment>>();
};

export const getSyncedPayment = async (id: string) => {
  const response = await fetchAdminApi(`/synced-payments/${id}`);
  return response.json<HydratedSyncedPayment>();
};

const action = async (
  id: string,
  name:
    | "confirm"
    | "reject"
    | "ignore"
    | "reassign"
    | "assign"
    | "update"
    | "revert",
  body?: {
    appointmentId?: string;
    paymentAmount?: number;
    tip?: number;
    paymentType?: string;
  },
) => {
  const response = await fetchAdminApi(`/synced-payments/${id}/${name}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  return response.json<SyncedPayment>();
};

export const confirmSyncedPayment = (id: string) => action(id, "confirm");

export const rejectSyncedPayment = (id: string) => action(id, "reject");

export const ignoreSyncedPayment = (id: string) => action(id, "ignore");

export const reassignSyncedPayment = (id: string, appointmentId: string) =>
  action(id, "reassign", { appointmentId });

export const assignSyncedPayment = (id: string, appointmentId: string) =>
  action(id, "assign", { appointmentId });

export const updateSyncedPaymentAmounts = (
  id: string,
  amounts: {
    paymentAmount: number;
    tip: number;
    paymentType: SyncedPaymentAssignablePaymentType;
  },
) => action(id, "update", amounts);

export const revertSyncedPaymentAmounts = (id: string) => action(id, "revert");

export const confirmAllMatchedSyncedPayments = async (params?: {
  start?: Date;
  end?: Date;
  externalId?: string;
}) => {
  const response = await fetchAdminApi("/synced-payments/confirm/matched", {
    method: "POST",
    body: JSON.stringify({
      start: params?.start?.toISOString(),
      end: params?.end?.toISOString(),
      externalId: params?.externalId,
    }),
  });

  return response.json<{ count: number }>();
};
