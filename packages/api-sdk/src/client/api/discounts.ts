import { ApplyDiscountRequest, ApplyDiscountResponse } from "@hacado/types";
import { fetchClientApi } from "./utils";

export const applyDiscount = async (request: ApplyDiscountRequest) => {
  console.debug("Applying discount", {
    request,
  });

  const response = await fetchClientApi("/discounts", {
    method: "POST",
    body: JSON.stringify(request),
  });

  const data = await response.json<ApplyDiscountResponse>();
  console.debug("Discount apply request processed successfully", {
    data,
  });

  return data;
};
