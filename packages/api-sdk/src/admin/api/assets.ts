import {
  AssetEntity,
  AssetUpdate,
  okStatus,
  UploadedFile,
  WithTotal,
} from "@hacado/types";
import {
  AssetsSearchParams,
  serializeAssetsSearchParams,
} from "../search-params/assets";
import { fetchAdminApi } from "./utils";

export const getAsset = async (id: string) => {
  console.debug("Getting asset", {
    id,
  });

  const response = await fetchAdminApi(`/assets/${id}`, {
    method: "GET",
  });

  const data = await response.json<UploadedFile>();
  console.debug("Asset retrieved successfully", {
    data,
  });

  return data;
};

export const getAssets = async (searchParams: AssetsSearchParams) => {
  console.debug("Getting assets", {
    searchParams,
  });

  const response = await fetchAdminApi(
    `/assets${serializeAssetsSearchParams(searchParams)}`,
    {
      method: "GET",
    },
  );

  const data = await response.json<WithTotal<UploadedFile>>();
  console.debug("Assets retrieved successfully", {
    data,
  });

  return data;
};

export const createAsset = async (
  file: File,
  options?: {
    bucket?: string;
    description?: string;
    appointmentId?: string;
    customerId?: string;
  },
) => {
  console.debug("Creating asset", {
    filename: file.name,
    options,
  });

  const formData = new FormData();
  formData.append("file", file);

  if (options?.description) {
    formData.append("description", options.description);
  }
  if (options?.appointmentId) {
    formData.append("appointmentId", options.appointmentId);
  }
  if (options?.customerId) {
    formData.append("customerId", options.customerId);
  }
  if (options?.bucket) {
    formData.append("bucket", options.bucket);
  }

  const response = await fetchAdminApi("/assets", {
    method: "POST",
    body: formData,
  });

  const data = await response.json<UploadedFile>();
  console.debug("Asset created successfully", {
    data,
  });

  return data;
};

export const updateAsset = async (id: string, update: AssetUpdate) => {
  console.debug("Updating asset", {
    id,
    update,
  });

  const response = await fetchAdminApi(`/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Asset updated successfully", {
    data,
  });

  return data;
};

export const deleteAsset = async (id: string) => {
  console.debug("Deleting asset", {
    id,
  });

  const response = await fetchAdminApi(`/assets/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<AssetEntity>();
  console.debug("Asset deleted successfully", {
    data,
  });

  return data;
};

export const deleteAssets = async (ids: string[]) => {
  console.debug("Deleting assets", {
    ids,
  });

  const response = await fetchAdminApi("/assets/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Assets deleted successfully", {
    data,
  });

  return data;
};

export const checkAssetUniqueFileName = async (
  filename: string,
  id?: string,
) => {
  console.debug("Checking asset filename uniqueness", {
    filename,
    id,
  });

  const searchParams = new URLSearchParams();
  searchParams.set("filename", filename);
  if (id) {
    searchParams.set("id", id);
  }

  const response = await fetchAdminApi(
    `/assets/check?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Asset filename uniqueness check completed", { data });

  return data.isUnique;
};
