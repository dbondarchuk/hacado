"use client";

import React from "react";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { AppointmentOption } from "@timelish/types";
import { Skeleton, useDebounceCacheFn } from "@timelish/ui";
import { durationToTime } from "@timelish/utils";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const OptionShortLabel: React.FC<{
  option: AppointmentOption;
}> = ({ option }) => {
  const time =
    option.durationType === "fixed" ? durationToTime(option.duration) : null;
  const t = useI18n("admin");
  const timeString = time ? t("common.timeDuration", time) : t("common.custom");
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap">
      <div className="flex gap-0.5 flex-col w-full">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {option.name}
        </span>
        <span className="text-xs italic">{timeString}</span>
      </div>
    </div>
  );
};

const OptionLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6">
      <div className="flex gap-0.5 flex-col">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-36 h-4" />
      </div>
    </div>
  );
};

export const OptionsDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "optionId", ...rest }) => {
  const t = useI18n("admin");
  const title = propsTitle ?? t("appointments.table.columns.option");

  const getOptions = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.serviceOptions.getServiceOptions({
        page,
        limit,
        search,
        priorityId: rest.filterValue ?? undefined,
      });

      return {
        items: result.items.map((option) => ({
          label: <OptionShortLabel option={option} />,
          shortLabel: option.name,
          value: option._id,
        })) satisfies AsyncFilterBoxOption[],
        hasMore: page * limit < result.total,
      };
    },
    300,
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={getOptions}
      {...rest}
      loader={<OptionLoader />}
    />
  );
};
