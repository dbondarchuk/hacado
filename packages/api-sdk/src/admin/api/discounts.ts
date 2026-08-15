import {
  Discount,
  DiscountUpdateModel,
  okStatus,
  WithTotal,
} from "@hacado/types";
import {
  checkDiscountNameAndCodeParamsSerializer,
  DiscountsSearchParams,
  discountsSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getDiscounts = async (params: DiscountsSearchParams) => {
  console.debug("Getting discounts", {
    params,
  });

  const serializedParams = discountsSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/discounts${serializedParams}`);

  const data = await response.json<WithTotal<Discount>>();
  console.debug("Discounts retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createDiscount = async (discount: DiscountUpdateModel) => {
  console.debug("Creating discount", {
    discount,
  });

  const response = await fetchAdminApi("/discounts", {
    method: "POST",
    body: JSON.stringify(discount),
  });

  const data = await response.json<Discount>();

  console.debug("Discount created successfully", {
    id: data._id,
  });

  return data;
};

export const updateDiscount = async (
  id: string,
  discount: DiscountUpdateModel,
) => {
  console.debug("Updating discount", {
    id,
    discount,
  });

  const response = await fetchAdminApi(`/discounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(discount),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Discount updated successfully", {
    id,
  });

  return data;
};

export const deleteDiscount = async (id: string) => {
  console.debug("Deleting discount", {
    id,
  });

  const response = await fetchAdminApi(`/discounts/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<Discount>();
  console.debug("Discount deleted successfully", {
    id,
    discountName: data.name,
  });

  return data;
};

export const deleteDiscounts = async (ids: string[]) => {
  console.debug("Deleting discounts", {
    ids,
  });

  const response = await fetchAdminApi("/discounts/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Discounts deleted successfully", {
    ids,
  });

  return data;
};

export const checkDiscountNameAndCode = async (
  name: string,
  codes: string[],
  id?: string,
) => {
  console.debug("Checking discount name and code", {
    name,
    codes,
    id,
  });

  const serializedParams = checkDiscountNameAndCodeParamsSerializer({
    name,
    codes,
    id,
  });
  const response = await fetchAdminApi(`/discounts/check${serializedParams}`);

  const data = await response.json<{
    name: boolean;
    code: Record<string, boolean>;
  }>();
  console.debug("Discount name and code checked successfully", {
    name,
    codes,
    id,
    data,
  });

  return data;
};
