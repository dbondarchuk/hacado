import {
  AppointmentAddon,
  AppointmentAddonUpdateModel,
} from "@hacado/types/booking";
import { WithTotal } from "@hacado/types/database";
import { okStatus } from "@hacado/types/general";
import { AddonsType } from "@hacado/types/services";
import {
  AddonsSearchParams,
  addonsSearchParamsSerializer,
} from "../search-params/addons";
import { fetchAdminApi } from "./utils";

export const getAddon = async (id: string) => {
  console.debug("Getting service addon", {
    id,
  });

  const response = await fetchAdminApi(`/catalog/addons/${id}`, {
    method: "GET",
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon retrieved successfully", {
    data,
  });

  return data;
};

export const getAddons = async (params: AddonsSearchParams) => {
  console.debug("Getting service addons", {
    params,
  });

  const response = await fetchAdminApi(
    `/catalog/addons${addonsSearchParamsSerializer(params)}`,
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

export const createAddon = async (addon: AppointmentAddonUpdateModel) => {
  console.debug("Creating service addon", {
    addon,
  });

  const response = await fetchAdminApi("/catalog/addons", {
    method: "POST",
    body: JSON.stringify(addon),
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon created successfully", {
    data,
  });

  return data;
};

export const updateAddon = async (
  id: string,
  addon: AppointmentAddonUpdateModel,
) => {
  console.debug("Updating service addon", {
    id,
    addon,
  });

  const response = await fetchAdminApi(`/catalog/addons/${id}`, {
    method: "PUT",
    body: JSON.stringify(addon),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service addon updated successfully", {
    data,
  });

  return data;
};

export const deleteAddon = async (id: string) => {
  console.debug("Deleting service addon", {
    id,
  });

  const response = await fetchAdminApi(`/catalog/addons/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<AppointmentAddon>();
  console.debug("Service addon deleted successfully", {
    data,
  });

  return data;
};

export const deleteAddons = async (ids: string[]) => {
  console.debug("Deleting service addons", {
    ids,
  });

  const response = await fetchAdminApi("/catalog/addons/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service addons deleted successfully", {
    data,
  });

  return data;
};

export const checkAddonUniqueName = async (name: string, id?: string) => {
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
    `/catalog/addons/check?${searchParams.toString()}`,
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
