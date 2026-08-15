import {
  okStatus,
  PageFooter,
  PageFooterListModel,
  PageFooterUpdateModel,
  WithTotal,
} from "@hacado/types";
import {
  PageFootersSearchParams,
  pageFootersSearchParamsSerializer,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getPageFooter = async (id: string) => {
  console.debug("Getting page footer", {
    id,
  });

  const response = await fetchAdminApi(`/pages/footers/${id}`);
  const data = await response.json<PageFooter>();
  console.debug("Page footer retrieved successfully", {
    id,
  });

  return data;
};

export const getPageFooters = async (params: PageFootersSearchParams) => {
  console.debug("Getting page footers", {
    params,
  });

  const serializedParams = pageFootersSearchParamsSerializer(params);
  const response = await fetchAdminApi(`/pages/footers${serializedParams}`);

  const data = await response.json<WithTotal<PageFooterListModel>>();
  console.debug("Page footers retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const createPageFooter = async (pageFooter: PageFooterUpdateModel) => {
  console.debug("Creating page footer", {
    pageFooter,
  });

  const response = await fetchAdminApi("/pages/footers", {
    method: "POST",
    body: JSON.stringify(pageFooter),
  });

  const data = await response.json<PageFooter>();
  console.debug("Page footer created successfully", {
    id: data._id,
  });

  return data;
};

export const updatePageFooter = async (
  id: string,
  pageFooter: PageFooterUpdateModel,
) => {
  console.debug("Updating page footer", {
    id,
    pageFooter,
  });

  const response = await fetchAdminApi(`/pages/footers/${id}`, {
    method: "PUT",
    body: JSON.stringify(pageFooter),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Page footer updated successfully", {
    id,
  });

  return data;
};

export const deletePageFooter = async (id: string) => {
  console.debug("Deleting page footer", {
    id,
  });

  const response = await fetchAdminApi(`/pages/footers/${id}`, {
    method: "DELETE",
  });

  const data = await response.json<PageFooter>();
  console.debug("Page footer deleted successfully", {
    id,
    pageFooterName: data.name,
  });

  return data;
};

export const deletePageFooters = async (ids: string[]) => {
  console.debug("Deleting page footers", {
    ids,
  });

  const response = await fetchAdminApi("/pages/footers/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Page footers deleted successfully", {
    ids,
  });

  return data;
};

export const checkUniquePageFooterName = async (name: string, id?: string) => {
  console.debug("Checking page footer name uniqueness", {
    name,
    id,
  });

  const response = await fetchAdminApi(
    `/pages/footers/check?name=${encodeURIComponent(name)}${id ? `&id=${encodeURIComponent(id)}` : ""}`,
  );

  const data = await response.json<{ isUnique: boolean }>();
  console.debug("Page footer name uniqueness check completed", {
    name,
    id,
    isUnique: data.isUnique,
  });

  return data.isUnique;
};
