import React from "react";
import { getServicesContainer } from "@/app/utils";
import {
  activitiesSearchParams,
  activitiesSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const ActivityTable: React.FC = async () => {
  const page = activitiesSearchParamsCache.get("page");
  const search = activitiesSearchParamsCache.get("search") || undefined;
  const limit = activitiesSearchParamsCache.get("limit");
  const sort = activitiesSearchParamsCache.get("sort");
  const start = activitiesSearchParamsCache.get("start") || undefined;
  const end = activitiesSearchParamsCache.get("end") || undefined;
  const severity = activitiesSearchParamsCache.get("severity") || undefined;
  const eventType = activitiesSearchParamsCache.get("eventType") || undefined;
  const actor = activitiesSearchParamsCache.get("actor") || undefined;

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.activityService.getActivities({
    offset,
    limit,
    search,
    sort,
    range:
      start || end
        ? { start: start ?? undefined, end: end ?? undefined }
        : undefined,
    severity: severity?.length ? severity : undefined,
    eventType: eventType?.length ? eventType : undefined,
    actor: actor?.length ? actor : undefined,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={activitiesSearchParams.sort.defaultValue}
    />
  );
};
