import {
  okStatus,
  PageHeader,
  PageHeaderListModel,
  PageHeaderUpdateModel,
  WithTotal,
} from "@hacado/types";
import {
  PageHeadersSearchParams,
  pageHeadersSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getPageHeader = async (id: string) => {
  console.debug("Getting page header", {
    id,
  });

  const response = await fetchAdminApi(`/pages/headers/${id}`);
  const data = await response.json<PageHeader>();
  console.debug("Page header retrieved successfully", {
    id,
  });

  return data;
};

export const getPageHeaders = async (params: PageHeadersSearchParams) => {
  console.debug("Getting page headers", {
    params,
  });

  const serializedParams = pageHeadersSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/pages/headers${serializedParams}`);

  const data = await response.json<WithTotal<PageHeaderListModel>>();
  console.debug("Page headers retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createPageHeader = async (pageHeader: PageHeaderUpdateModel) => {
  console.debug("Creating page header", {
    pageHeader,
  });

  const response = await fetchAdminApi("/pages/headers", {
    method: "POST",
    body: JSON.stringify(pageHeader),
  });

  const data = await response.json<PageHeader>();
  console.debug("Page header created successfully", {
    id: data._id,
  });

  return data;
};

export const updatePageHeader = async (
  id: string,
  pageHeader: PageHeaderUpdateModel,
) => {
  console.debug("Updating page header", {
    id,
    pageHeader,
  });

  const response = await fetchAdminApi(`/pages/headers/${id}`, {
    method: "PUT",
    body: JSON.stringify(pageHeader),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Page header updated successfully", {
    id,
  });

  return data;
};

export const deletePageHeader = async (id: string) => {
  console.debug("Deleting page header", {
    id,
  });

  const response = await fetchAdminApi(`/pages/headers/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<PageHeader>();
  console.debug("Page header deleted successfully", {
    id,
    pageHeaderName: data.name,
  });

  return data;
};

export const deletePageHeaders = async (ids: string[]) => {
  console.debug("Deleting page headers", {
    ids,
  });

  const response = await fetchAdminApi("/pages/headers/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Page headers deleted successfully", {
    ids,
  });

  return data;
};

export const checkUniquePageHeaderName = async (name: string, id?: string) => {
  console.debug("Checking page header name uniqueness", {
    name,
    id,
  });

  const response = await fetchAdminApi(
    `/pages/headers/check?name=${encodeURIComponent(name)}${id ? `&id=${encodeURIComponent(id)}` : ""}`,
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Page header name uniqueness check completed", {
    name,
    id,
    isUnique: data.isUnique,
  });

  return data.isUnique;
};
