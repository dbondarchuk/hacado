"use client";

import React from "react";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentPackage } from "@hacado/types";
import { Skeleton, useCurrencyFormat, useDebounceCacheFn } from "@hacado/ui";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const PackageShortLabel: React.FC<{
  pkg: AppointmentPackage;
}> = ({ pkg }) => {
  const currencyFormat = useCurrencyFormat();
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap">
      <div className="flex gap-0.5 flex-col w-full overflow-hidden">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {pkg.name}
        </span>
        <span className="text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
          {currencyFormat(pkg.price)}
        </span>
      </div>
    </div>
  );
};

const PackageLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6">
      <div className="flex gap-0.5 flex-col">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );
};

export const PackagesDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "packageId", ...rest }) => {
  const t = useI18n("admin");
  const title = propsTitle ?? t("services.packages.sold.table.filters.package");

  const getPackages = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.packages.getPackages({
        page,
        limit,
        search,
        priorityId: rest.filterValue ?? undefined,
      });

      return {
        items: result.items.map((pkg) => ({
          label: <PackageShortLabel pkg={pkg} />,
          shortLabel: pkg.name,
          value: pkg._id,
        })) satisfies AsyncFilterBoxOption[],
        hasMore: page * limit < result.total,
      };
    },
    100,
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={getPackages}
      {...rest}
      loader={<PackageLoader />}
    />
  );
};
