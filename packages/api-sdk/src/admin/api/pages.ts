import {
  okStatus,
  Page,
  PageListModelWithUrl,
  PageUpdateModel,
  WithTotal,
} from "@hacado/types";
import {
  PagesSearchParams,
  pagesSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getPages = async (params: PagesSearchParams) => {
  console.debug("Getting pages", {
    params,
  });

  const serializedParams = pagesSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/pages${serializedParams}`);

  const data = await response.json<WithTotal<PageListModelWithUrl>>();
  console.debug("Pages retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createPage = async (page: PageUpdateModel) => {
  console.debug("Creating page", {
    page,
  });

  const response = await fetchAdminApi("/pages", {
    method: "POST",
    body: JSON.stringify(page),
  });

  const data = await response.json<Page>();
  console.debug("Page created successfully", {
    id: data._id,
  });

  return data;
};

export const updatePage = async (id: string, page: PageUpdateModel) => {
  console.debug("Updating page", {
    id,
    page,
  });

  const response = await fetchAdminApi(`/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(page),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Page updated successfully", {
    id,
  });

  return data;
};

export const deletePage = async (id: string) => {
  console.debug("Deleting page", {
    id,
  });

  const response = await fetchAdminApi(`/pages/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<Page>();
  console.debug("Page deleted successfully", {
    id,
    pageTitle: data.title,
  });

  return data;
};

export const deletePages = async (ids: string[]) => {
  console.debug("Deleting pages", {
    ids,
  });

  const response = await fetchAdminApi("/pages/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Pages deleted successfully", {
    ids,
  });

  return data;
};

export const checkUniqueSlug = async (slug: string, id?: string) => {
  console.debug("Checking page slug uniqueness", {
    slug,
    id,
  });

  const response = await fetchAdminApi(
    `/pages/check?slug=${encodeURIComponent(slug)}${id ? `&id=${encodeURIComponent(id)}` : ""}`,
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Page slug uniqueness check completed", {
    slug,
    id,
    isUnique: data.isUnique,
  });

  return data.isUnique;
};
