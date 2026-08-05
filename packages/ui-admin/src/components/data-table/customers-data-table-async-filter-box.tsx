"use client";

// import Image from "next/image";
import React from "react";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerListModel } from "@hacado/types";
import { Skeleton, useDebounceCacheFn } from "@hacado/ui";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const CustomerShortLabel: React.FC<{
  customer: CustomerListModel;
}> = ({ customer }) => {
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap">
      <img
        src={customer.avatar ?? "/unknown-person.png"}
        width={20}
        height={20}
        alt={customer.name}
      />
      <div className="flex gap-0.5 flex-col w-full overflow-hidden">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.name}
        </span>
        <span className="text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.email}
        </span>
        <span className="text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
          {customer.phone}
        </span>
      </div>
    </div>
  );
};

const CustomerLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="flex gap-0.5 flex-col">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-36 h-4" />
        <Skeleton className="w-36 h-4" />
      </div>
    </div>
  );
};

export const CustomersDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "customerId", ...rest }) => {
  const t = useI18n("admin");
  const title = propsTitle ?? t("appointments.table.columns.customer");

  const getCustomers = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.customers.getCustomers({
        page,
        limit,
        search,
        priorityId: rest.filterValue ?? undefined,
      });

      return {
        items: result.items.map((customer) => ({
          label: <CustomerShortLabel customer={customer} />,
          shortLabel: customer.name,
          value: customer._id,
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
      fetchItems={getCustomers}
      {...rest}
      loader={<CustomerLoader />}
    />
  );
};
