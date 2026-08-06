"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
} from "@hacado/ui-admin";
import { Settings2 } from "lucide-react";
import React from "react";
import { ActivityEventTypeAsyncFilterBox } from "./activity-event-type-async-filter";
import { useActivityTableFilters } from "./use-activity-table-filters";

const severities = ["info", "success", "warning", "error"] as const;
const actors = ["system", "member", "customer"] as const;

export const ActivityTableAction: React.FC<{ className?: string }> = ({
  className,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    setPage,
    resetFilters,
    isAnyFilterActive,
    severityFilter,
    setSeverityFilter,
    actorFilter,
    setActorFilter,
    eventTypeFilter,
    setEventTypeFilter,
    start,
    setStart,
    end,
    setEnd,
  } = useActivityTableFilters();

  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="severity"
        title={t("activity.table.filters.severity")}
        options={severities.map((s) => ({
          value: s,
          label: t(`activity.severity.${s}`),
        }))}
        setFilterValue={setSeverityFilter as any}
        filterValue={severityFilter ?? []}
      />
      <DataTableFilterBox
        filterKey="actor"
        title={t("activity.table.filters.actor")}
        options={actors.map((a) => ({
          value: a,
          label: t(`activity.table.filters.actorKind.${a}`),
        }))}
        setFilterValue={setActorFilter as any}
        filterValue={actorFilter ?? []}
      />
      <ActivityEventTypeAsyncFilterBox
        filterValue={eventTypeFilter ?? null}
        setFilterValue={setEventTypeFilter}
      />
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStart}
        setEndValue={setEnd}
      />
    </>
  );

  return (
    <div
      className={cn(
        "flex flex-col flex-wrap md:items-center justify-between gap-4 md:flex-row w-full",
        className,
      )}
    >
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="search"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder={t("activity.table.searchPlaceholder")}
        />
        <Popover>
          <PopoverTrigger
            tooltip={t("common.labels.filters")}
            asChild
            className="md:hidden"
          >
            <Button variant="outline" size="sm">
              <Settings2 className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex w-auto max-w-[min(100vw-2rem,24rem)] flex-col gap-2">
            {additionalFilters}
          </PopoverContent>
        </Popover>
        <div className="hidden md:flex md:flex-row md:flex-wrap md:items-center md:gap-4">
          {additionalFilters}
        </div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
    </div>
  );
};
