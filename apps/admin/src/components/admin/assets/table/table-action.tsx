"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { cn } from "@hacado/ui/cn";

import React from "react";
import { DeleteSelectedAssetsButton } from "./delete-selected-button";
import { useAssetsTableFilters } from "./use-table-filters";

export const AssetsTableAction: React.FC<{
  showCustomerFilter?: boolean;
  className?: string;
  onDelete?: () => void;
  /** When false, hide bulk delete (e.g. staff viewing customer files). Default true. */
  allowDelete?: boolean;
}> = ({ showCustomerFilter, className, onDelete, allowDelete = true }) => {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    customerFilter,
    setCustomerFilter,
  } = useAssetsTableFilters();
  const { rowSelection } = useSelectedRowsStore();
  const t = useI18n("admin");

  const additionalFilters = showCustomerFilter ? (
    <>
      {showCustomerFilter && (
        <CustomersDataTableAsyncFilterBox
          filterValue={customerFilter}
          setFilterValue={setCustomerFilter}
        />
      )}
    </>
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {additionalFilters && (
          <>
            <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
          </>
        )}
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      {allowDelete ? (
        <div className="flex flex-wrap items-center gap-4">
          <DeleteSelectedAssetsButton
            selected={rowSelection}
            onDelete={onDelete}
          />
        </div>
      ) : null}
    </div>
  );
};
