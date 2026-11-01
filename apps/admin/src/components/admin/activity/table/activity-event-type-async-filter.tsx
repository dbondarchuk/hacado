"use client";

import { activitiesApi } from "@hacado/api-sdk/admin/activities";
import { useI18n } from "@hacado/i18n/client";
import {
  AsyncFilterBoxOption,
  DataTableAsyncFilterBox,
} from "@hacado/ui-admin/data-table";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Skeleton } from "@hacado/ui/skeleton";
import React from "react";

export const ActivityEventTypeAsyncFilterBox: React.FC<{
  filterValue: string[] | null;
  setFilterValue: (
    value: string[] | ((old: string[] | null) => string[] | null) | null,
  ) => Promise<URLSearchParams>;
}> = ({ filterValue, setFilterValue }) => {
  const t = useI18n("admin");

  const fetchItems = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await activitiesApi.getActivityEventTypes({
        page,
        limit,
        search,
      });

      return {
        items: result.items.map(
          (value) =>
            ({
              value,
              label: <span className="font-mono text-sm">{value}</span>,
              shortLabel: value,
            }) satisfies AsyncFilterBoxOption,
        ),
        hasMore: page * limit < result.total,
      };
    },
    300,
  );

  return (
    <DataTableAsyncFilterBox
      filterKey="eventType"
      title={t("activity.table.filters.eventType")}
      filterValue={filterValue}
      setFilterValue={setFilterValue}
      fetchItems={fetchItems}
      loader={<Skeleton className="w-full h-5" />}
    />
  );
};
