import {
  CollectPayment,
  CreateOrUpdatePaymentIntentRequest,
} from "@hacado/types";
import { fetchClientApi } from "./utils";

export const createPaymentIntent = async (
  request: CreateOrUpdatePaymentIntentRequest,
) => {
  console.debug("Creating or updating payment intent", {
    request,
  });

  const response = await fetchClientApi("/payments", {
    method: "POST",
    body: JSON.stringify(request),
  });

  const data = await response.json<CollectPayment>();
  console.debug("Payment intent created or updated successfully");

  return data;
};

export const updatePaymentIntent = async (
  intentId: string,
  request: CreateOrUpdatePaymentIntentRequest,
) => {
  console.debug("Updating payment intent", {
    intentId,
    request,
  });

  const response = await fetchClientApi(`/payments/${intentId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });

  const data = await response.json<CollectPayment>();
  console.debug("Payment intent updated successfully");

  return data;
};
