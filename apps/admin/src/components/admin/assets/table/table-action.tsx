"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import React from "react";
import { DeleteSelectedAssetsButton } from "./delete-selected-button";
import { useAssetsTableFilters } from "./use-table-filters";

export const AssetsTableAction: React.FC<{
  showCustomerFilter?: boolean;
  className?: string;
  onDelete?: () => void;
  /** When false, hide bulk delete (e.g. staff viewing customer files). Default true. */
  allowDelete?: boolean;
  actions?: React.ReactNode;
}> = ({
  showCustomerFilter,
  className,
  onDelete,
  allowDelete = true,
  actions,
}) => {
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
    <>
      <DataTableToolbar actions={actions} className={className}>
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {additionalFilters ? (
          <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
        ) : null}
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </DataTableToolbar>
      {allowDelete ? (
        <SelectionActionBar count={rowSelection.length}>
          <DeleteSelectedAssetsButton
            selected={rowSelection}
            onDelete={onDelete}
          />
        </SelectionActionBar>
      ) : null}
    </>
  );
};
