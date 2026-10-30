import { ServiceField, ServiceFieldUpdateModel } from "@hacado/types/booking";
import { WithTotal } from "@hacado/types/database";
import { okStatus } from "@hacado/types/general";
import { FieldsType } from "@hacado/types/services";
import {
  FieldsSearchParams,
  fieldsSearchParamsSerializer,
} from "../search-params/fields";
import { fetchAdminApi } from "./utils";

export const getField = async (id: string) => {
  console.debug("Getting service field", {
    id,
  });

  const response = await fetchAdminApi(`/catalog/fields/${id}`, {
    method: "GET",
  });

  const data = await response.json<ServiceField>();
  console.debug("Service field retrieved successfully", {
    data,
  });

  return data;
};

export const getFields = async (params: FieldsSearchParams) => {
  console.debug("Getting service fields", {
    params,
  });

  const response = await fetchAdminApi(
    `/catalog/fields${fieldsSearchParamsSerializer(params)}`,
    {
      method: "GET",
    },
  );

  const includeUsage = params.includeUsage ?? false;

  const data =
    await response.json<WithTotal<FieldsType<typeof includeUsage>>>();
  console.debug("Service fields retrieved successfully", {
    data,
  });

  return data;
};

export const createField = async (field: ServiceFieldUpdateModel) => {
  console.debug("Creating service field", {
    field,
  });

  const response = await fetchAdminApi("/catalog/fields", {
    method: "POST",
    body: JSON.stringify(field),
  });

  const data = await response.json<ServiceField>();
  console.debug("Service field created successfully", {
    data,
  });

  return data;
};

export const updateField = async (
  id: string,
  field: ServiceFieldUpdateModel,
) => {
  console.debug("Updating service field", {
    id,
    field,
  });

  const response = await fetchAdminApi(`/catalog/fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(field),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service field updated successfully", {
    data,
  });

  return data;
};

export const deleteField = async (id: string) => {
  console.debug("Deleting service field", {
    id,
  });

  const response = await fetchAdminApi(`/catalog/fields/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Service field deleted successfully", {
    data,
  });

  return data;
};

export const deleteFields = async (ids: string[]) => {
  console.debug("Deleting service fields", {
    ids,
  });

  const response = await fetchAdminApi("/catalog/fields/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<ServiceField>();
  console.debug("Service fields deleted successfully", {
    data,
  });

  return data;
};

export const checkFieldUniqueName = async (name: string, id?: string) => {
  console.debug("Checking service field name uniqueness", {
    name,
    id,
  });

  const searchParams = new URLSearchParams();
  searchParams.set("name", name);
  if (id) {
    searchParams.set("id", id);
  }

  const response = await fetchAdminApi(
    `/catalog/fields/check?${searchParams.toString()}`,
    {
      method: "GET",
    },
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Service field name uniqueness check completed", {
    data,
  });

  return data.isUnique;
};
