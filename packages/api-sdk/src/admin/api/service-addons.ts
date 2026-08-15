import {
  AddonsType,
  AppointmentAddon,
  AppointmentAddonUpdateModel,
  okStatus,
  WithTotal,
} from "@hacado/types";
import {
  ServiceAddonsSearchParams,
  serviceAddonsSearchParamsSerializer,
} from "../search-params/service-addons";
import { fetchAdminApi } from "./utils";

export const getServiceAddon = async (id: string) => {
  console.debug("Getting service addon", {
    id,
  });

  const response = await fetchAdminApi(`/services/addons/${id}`, {
    method: "GET",
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon retrieved successfully", {
    data,
  });

  return data;
};

export const getServiceAddons = async (params: ServiceAddonsSearchParams) => {
  console.debug("Getting service addons", {
    params,
  });

  const response = await fetchAdminApi(
    `/services/addons${serviceAddonsSearchParamsSerializer(params)}`,
    {
      method: "GET",
    },
  );

  const includeUsage = params.includeUsage ?? false;

  const data =
    await response.json<WithTotal<AddonsType<typeof includeUsage>>>();
  console.debug("Service addons retrieved successfully", {
    data,
  });

  return data;
};

export const createServiceAddon = async (
  addon: AppointmentAddonUpdateModel,
) => {
  console.debug("Creating service addon", {
    addon,
  });

  const response = await fetchAdminApi("/services/addons", {
    method: "POST",
    body: JSON.stringify(addon),
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon created successfully", {
    data,
  });

  return data;
};

export const updateServiceAddon = async (
  id: string,
  addon: AppointmentAddonUpdateModel,
) => {
  console.debug("Updating service addon", {
    id,
    addon,
  });

  const response = await fetchAdminApi(`/services/addons/${id}`, {
    method: "PUT",
    body: JSON.stringify(addon),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service addon updated successfully", {
    data,
  });

  return data;
};

export const deleteServiceAddon = async (id: string) => {
  console.debug("Deleting service addon", {
    id,
  });

  const response = await fetchAdminApi(`/services/addons/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon deleted successfully", {
    data,
  });

  return data;
};

export const deleteServiceAddons = async (ids: string[]) => {
  console.debug("Deleting service addons", {
    ids,
  });

  const response = await fetchAdminApi("/services/addons/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service addons deleted successfully", {
    data,
  });

  return data;
};

export const checkServiceAddonUniqueName = async (
  name: string,
  id?: string,
) => {
  console.debug("Checking service addon name uniqueness", {
    name,
    id,
  });

  const searchParams = new URLSearchParams();
  searchParams.set("name", name);
  if (id) {
    searchParams.set("id", id);
  }

  const response = await fetchAdminApi(
    `/services/addons/check?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Service addon name uniqueness check completed", {
    data,
  });

  return data.isUnique;
};
