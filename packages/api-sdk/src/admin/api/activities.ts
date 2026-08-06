import type { ActivityListItem, WithTotal } from "@hacado/types";
import {
  ActivitiesSearchParams,
  serializeActivitiesSearchParams,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getActivities = async (searchParams: ActivitiesSearchParams) => {
  const serialized = serializeActivitiesSearchParams(searchParams);
  const result = await fetchAdminApi(`/activities${serialized}`);
  return result.json<WithTotal<ActivityListItem>>();
};

export const markActivityFeedRead = async () => {
  const result = await fetchAdminApi("/activities/read", {
    method: "POST",
  });
  return result.json();
};

export const getActivityEventTypes = async (params: {
  page: number;
  limit?: number;
  search?: string;
}) => {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", String(params.limit ?? 10));
  if (params.search) {
    sp.set("search", params.search);
  }
  const result = await fetchAdminApi(`/activities/event-types?${sp}`);
  return result.json<{ items: string[]; total: number }>();
};
