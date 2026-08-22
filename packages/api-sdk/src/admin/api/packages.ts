import {
  AppointmentPackage,
  AppointmentPackageListModel,
  AppointmentPackageStatus,
  AppointmentPackageUpdateModel,
  CustomerPackage,
  CustomerPackageListModel,
  okStatus,
  PackageAdjustRequest,
  WithTotal,
} from "@hacado/types";
import {
  PackagesSearchParams,
  packagesSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getPackages = async (params: PackagesSearchParams) => {
  console.debug("Getting packages", {
    params,
  });

  const serializedParams = packagesSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/packages${serializedParams}`);
  const data = await response.json<WithTotal<AppointmentPackageListModel>>();
  console.debug("Packages retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const getPackage = async (id: string) => {
  const response = await fetchAdminApi(`/packages/${id}`);
  const data = await response.json<AppointmentPackage>();
  console.debug("Package retrieved successfully", {
    id,
    packageName: data.name,
  });

  return data;
};

export const createPackage = async (data: AppointmentPackageUpdateModel) => {
  console.debug("Creating package", {
    data,
  });

  const response = await fetchAdminApi("/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json<AppointmentPackage>();
  console.debug("Package created successfully", {
    id: result._id,
    packageName: result.name,
  });

  return result;
};

export const updatePackage = async (
  id: string,
  data: AppointmentPackageUpdateModel,
) => {
  console.debug("Updating package", {
    id,
    data,
  });

  const response = await fetchAdminApi(`/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  const result = await response.json<typeof okStatus>();
  console.debug("Package updated successfully", {
    id,
    result,
  });

  return result;
};

export const deletePackage = async (id: string) => {
  console.debug("Deleting package", {
    id,
  });

  const response = await fetchAdminApi(`/packages/${id}`, {
    method: "DELETE",
  });

  const result = await response.json<typeof okStatus>();
  console.debug("Package deleted successfully", {
    id,
    result,
  });

  return result;
};

export const setPackageStatus = async (
  id: string,
  status: AppointmentPackageStatus,
) => {
  console.debug("Setting package status", {
    id,
    status,
  });

  const response = await fetchAdminApi(`/packages/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });

  const result = await response.json<AppointmentPackage>();
  console.debug("Package status set successfully", {
    id,
    status,
    result,
  });

  return result;
};

export const sellPackage = async (
  id: string,
  body: {
    customerId: string;
    paymentId?: string;
    paymentIntentId?: string;
    price?: number;
  },
) => {
  console.debug("Selling package", {
    id,
    body,
  });

  const response = await fetchAdminApi(`/packages/${id}/sell`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const result = await response.json<CustomerPackage>();
  console.debug("Package sold successfully", {
    id,
    result,
  });

  return result;
};

export const getCustomerPackages = async (params: {
  customerId?: string | string[];
  packageId?: string | string[];
  status?: CustomerPackage["status"][];
  page?: number;
  limit?: number;
  search?: string;
  sort?: { id: string; desc: boolean }[];
}) => {
  console.debug("Getting customer packages", {
    params,
  });

  const search = new URLSearchParams();
  const customerIds = params.customerId
    ? Array.isArray(params.customerId)
      ? params.customerId
      : [params.customerId]
    : [];
  for (const id of customerIds) search.append("customerId", id);
  const packageIds = params.packageId
    ? Array.isArray(params.packageId)
      ? params.packageId
      : [params.packageId]
    : [];
  for (const id of packageIds) search.append("packageId", id);
  for (const status of params.status ?? []) search.append("status", status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.sort) search.set("sort", JSON.stringify(params.sort));
  const qs = search.toString();
  const response = await fetchAdminApi(
    `/customer-packages${qs ? `?${qs}` : ""}`,
  );

  const data = await response.json<WithTotal<CustomerPackageListModel>>();
  console.debug("Customer packages retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const getEligibleCustomerPackages = async (params: {
  customerId: string;
  optionId: string;
  memberId: string;
  dateTime?: Date;
}) => {
  console.debug("Getting eligible customer packages", {
    params,
  });

  const search = new URLSearchParams({
    customerId: params.customerId,
    optionId: params.optionId,
    memberId: params.memberId,
  });

  if (params.dateTime) {
    search.set("dateTime", params.dateTime.toISOString());
  }
  const response = await fetchAdminApi(
    `/customer-packages/eligible?${search.toString()}`,
  );

  const data = await response.json<{ items: CustomerPackage[] }>();
  console.debug("Eligible customer packages retrieved successfully", {
    total: data.items.length,
    count: data.items.length,
  });

  return data;
};

export const adjustCustomerPackage = async (
  id: string,
  request: PackageAdjustRequest,
) => {
  console.debug("Adjusting customer package", {
    id,
    request,
  });

  const response = await fetchAdminApi(`/customer-packages/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(request),
  });

  const result = await response.json<CustomerPackage>();
  console.debug("Customer package adjusted successfully", {
    id,
    result,
  });

  return result;
};
