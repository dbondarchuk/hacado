import {
  GiftCardListModel,
  GiftCardStatus,
  GiftCardUpdateModel,
  okStatus,
  PaymentSummary,
  WithTotal,
} from "@hacado/types";
import {
  checkGiftCardCodeUniqueParamsSerializer,
  GiftCardsSearchParams,
  giftCardsSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getGiftCard = async (id: string) => {
  console.debug("Getting gift card", {
    id,
  });

  const response = await fetchAdminApi(`/gift-cards/${id}`);
  const data = await response.json<GiftCardListModel>();
  console.debug("Gift card retrieved successfully", {
    id,
    giftCardCode: data.code,
  });

  return data;
};

export const getGiftCards = async (params: GiftCardsSearchParams) => {
  console.debug("Getting gift cards", {
    params,
  });

  const serializedParams = giftCardsSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/gift-cards${serializedParams}`);

  const data = await response.json<WithTotal<GiftCardListModel>>();
  console.debug("Gift cards retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createGiftCard = async (giftCard: GiftCardUpdateModel) => {
  console.debug("Creating gift card", {
    giftCard,
  });

  const response = await fetchAdminApi("/gift-cards", {
    method: "POST",
    body: JSON.stringify(giftCard),
  });

  const data = await response.json<GiftCardListModel>();

  console.debug("Gift card created successfully", {
    id: data._id,
  });

  return data;
};

export const updateGiftCard = async (
  id: string,
  giftCard: GiftCardUpdateModel,
) => {
  console.debug("Updating gift card", {
    id,
    giftCard,
  });

  const response = await fetchAdminApi(`/gift-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(giftCard),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Gift card updated successfully", {
    id,
  });

  return data;
};

export const setGiftCardStatus = async (id: string, status: GiftCardStatus) => {
  console.debug("Setting gift card status", {
    id,
    status,
  });

  const response = await fetchAdminApi(`/gift-cards/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Gift card status updated successfully", {
    id,
    status,
  });

  return data;
};

export const setGiftCardsStatus = async (
  ids: string[],
  status: GiftCardStatus,
) => {
  console.debug("Setting gift cards status", {
    ids,
    status,
  });

  const response = await fetchAdminApi("/gift-cards/set-status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Gift cards status updated successfully", {
    ids,
    status,
  });

  return data;
};

export const deleteGiftCard = async (id: string) => {
  console.debug("Deleting gift card", {
    id,
  });

  const response = await fetchAdminApi(`/gift-cards/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<GiftCardListModel>();
  console.debug("Gift card deleted successfully", {
    id,
    giftCardCode: data.code,
  });

  return data;
};

export const deleteGiftCards = async (ids: string[]) => {
  console.debug("Deleting gift cards", {
    ids,
  });

  const response = await fetchAdminApi("/gift-cards/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Gift cards deleted successfully", {
    ids,
  });

  return data;
};

export const checkGiftCardCodeUnique = async (code: string, id?: string) => {
  console.debug("Checking gift card code uniqueness", {
    code,
    id,
  });

  const serializedParams = checkGiftCardCodeUniqueParamsSerializer({
    code,
    id,
  });
  const response = await fetchAdminApi(`/gift-cards/check${serializedParams}`);

  const data = await response.json<boolean>();

  console.debug("Gift card code uniqueness checked successfully", {
    code,
    id,
    data,
  });

  return data;
};

export const getGiftCardPayments = async (id: string) => {
  console.debug("Getting gift card payments", {
    id,
  });

  const response = await fetchAdminApi(`/gift-cards/${id}/payments`);
  const data = await response.json<PaymentSummary[]>();

  console.debug("Gift card payments retrieved successfully", {
    id,
    count: data.length,
  });

  return data;
};
