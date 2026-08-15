import { ApplyGiftCardsRequest, ApplyGiftCardsResponse } from "@hacado/types";
import { fetchClientApi } from "./utils";

export const applyGiftCards = async (request: ApplyGiftCardsRequest) => {
  console.debug("Applying gift cards", {
    request,
  });

  const response = await fetchClientApi("/gift-cards", {
    method: "POST",
    body: JSON.stringify(request),
  });

  const data = await response.json<ApplyGiftCardsResponse>();
  console.debug("Gift cards apply request processed successfully", {
    data,
  });

  return data;
};
