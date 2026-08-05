import {
  AppointmentOption,
  AppointmentOptionUpdateModel,
  okStatus,
  WithTotal,
} from "@hacado/types";
import {
  ServiceOptionsSearchParams,
  serviceOptionsSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getServiceOption = async (id: string) => {
  console.debug("Getting service option", {
    id,
  });

  const response = await fetchAdminApi(`/services/options/${id}`);
  const data = await response.json<AppointmentOption>();
  console.debug("Service option retrieved successfully", {
    id,
  });

  return data;
};

export const getServiceOptions = async (params: ServiceOptionsSearchParams) => {
  console.debug("Getting service options", {
    params,
  });

  const serializedParams = serviceOptionsSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/services/options${serializedParams}`, {
    method: "GET",
  });

  const data = await response.json<WithTotal<AppointmentOption>>();
  console.debug("Service options retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createServiceOption = async (
  option: AppointmentOptionUpdateModel,
) => {
  console.debug("Creating service option", {
    option,
  });

  const response = await fetchAdminApi("/services/options", {
    method: "POST",
    body: JSON.stringify(option),
  });

  const data = await response.json<AppointmentOption>();
  console.debug("Service option created successfully", {
    id: data._id,
  });

  return data;
};

export const updateServiceOption = async (
  id: string,
  option: AppointmentOptionUpdateModel,
) => {
  console.debug("Updating service option", {
    id,
    option,
  });

  const response = await fetchAdminApi(`/services/options/${id}`, {
    method: "PUT",
    body: JSON.stringify(option),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service option updated successfully", {
    id,
  });

  return data;
};

export const deleteServiceOption = async (id: string) => {
  console.debug("Deleting service option", {
    id,
  });

  const response = await fetchAdminApi(`/services/options/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<AppointmentOption>();
  console.debug("Service option deleted successfully", {
    id,
    optionName: data.name,
  });

  return data;
};

export const deleteServiceOptions = async (ids: string[]) => {
  console.debug("Deleting service options", {
    ids,
  });

  const response = await fetchAdminApi("/services/options/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service options deleted successfully", {
    ids,
  });

  return data;
};

export const checkServiceOptionUniqueName = async (
  name: string,
  id?: string,
) => {
  console.debug("Checking service option name uniqueness", {
    name,
    id,
  });

  const response = await fetchAdminApi(
    `/services/options/check?name=${encodeURIComponent(name)}${id ? `&id=${encodeURIComponent(id)}` : ""}`,
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Service option name uniqueness check completed", {
    name,
    id,
    isUnique: data.isUnique,
  });

  return data.isUnique;
};
