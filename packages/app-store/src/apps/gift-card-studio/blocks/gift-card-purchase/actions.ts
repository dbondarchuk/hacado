import { clientApi } from "@hacado/api-sdk";
import { CollectPayment } from "@hacado/types";
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
  const res = await clientApi.apps.callAppApi<FetchPreviewResponse>({
    appId,
    path: "preview",
    method: "POST",
    body: payload,
  });

  return res;
};

export const getInitOptions = async (appId: string) => {
  const res = await clientApi.apps.callAppApi<GetInitOptionsResponse>({
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
  const res = await clientApi.apps.callAppApi<CollectPayment>({
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
  const res = await clientApi.apps.callAppApi<
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
