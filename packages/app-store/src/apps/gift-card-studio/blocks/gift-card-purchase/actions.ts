import { appsApi } from "@hacado/api-sdk/client/apps";
import { CollectPayment } from "@hacado/types/booking";
import {
  FetchPreviewPayload,
  FetchPreviewResponse,
  GetInitOptionsResponse,
  IntentRequest,
  PurchaseRequestPayload,
} from "../../models/public";

export const fetchPreview = async (
  appId: string,
  payload: FetchPreviewPayload,
) => {
  const res = await appsApi.callAppApi<FetchPreviewResponse>({
    appId,
    path: "preview",
    method: "POST",
    body: payload,
  });

  return res;
};

export const getInitOptions = async (appId: string) => {
  const res = await appsApi.callAppApi<GetInitOptionsResponse>({
    appId,
    path: "init-options",
    method: "GET",
  });
  return res;
};

export const createOrUpdateIntent = async (
  appId: string,
  payload: IntentRequest,
) => {
  const res = await appsApi.callAppApi<CollectPayment>({
    appId,
    path: "intent",
    method: "POST",
    body: payload,
  });
  return res;
};

export const purchaseGiftCard = async (
  appId: string,
  payload: PurchaseRequestPayload,
) => {
  const res = await appsApi.callAppApi<
    | { success: true; giftCardCode: string }
    | { success: false; code: string; error: string }
  >({
    appId,
    path: "purchase",
    method: "POST",
    body: payload,
  });
  return res;
};
