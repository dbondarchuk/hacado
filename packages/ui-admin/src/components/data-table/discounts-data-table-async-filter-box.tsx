"use client";

import React from "react";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Discount } from "@hacado/types";
import {
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useDebounceCacheFn,
} from "@hacado/ui";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const DiscountShortLabel: React.FC<{
  discount: Discount;
}> = ({ discount }) => {
  return (
    <div className="flex flex-col gap-2 shrink overflow-hidden text-nowrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{discount.name}</TooltipTrigger>
          <TooltipContent>{discount.name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="text-sm italic">
        (-{discount.type === "amount" && "$"}
        {discount.value}
        {discount.type === "percentage" && "%"})
      </span>
    </div>
  );
};

const DiscountLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-col gap-2 overflow-hidden text-nowrap pl-6">
      <Skeleton className="w-40 h-5" />
      <Skeleton className="w-36 h-4" />
    </div>
  );
};

export const DiscountsDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "discountId", ...rest }) => {
  const t = useI18n("admin");
  const title = propsTitle ?? t("appointments.table.columns.discount");

  const getDiscounts = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.discounts.getDiscounts({
        page,
        limit,
        search,
        priorityId: rest.filterValue ?? undefined,
      });

      return {
        items: result.items.map((discount) => ({
          label: <DiscountShortLabel discount={discount} />,
          shortLabel: discount.name,
          value: discount._id,
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
      fetchItems={getDiscounts}
      {...rest}
      loader={<DiscountLoader />}
    />
  );
};
