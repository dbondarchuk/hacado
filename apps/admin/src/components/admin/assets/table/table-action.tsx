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
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { Settings2 } from "lucide-react";
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
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {additionalFilters && (
          <>
            <Popover>
              <PopoverTrigger
                tooltip={t("assets.table.filters.filters")}
                asChild
                className="md:hidden"
              >
                <Button variant="outline">
                  <Settings2 size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2">
                {additionalFilters}
              </PopoverContent>
            </Popover>
            <div className="hidden md:flex flex-row gap-4">
              {additionalFilters}
            </div>
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
