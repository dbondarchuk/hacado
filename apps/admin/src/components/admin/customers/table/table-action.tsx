"use client";

import { useAuth } from "@hacado/ui-admin/context";
import {
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { hasPermission } from "@hacado/utils/permissions";
import React from "react";
import { DeleteSelectedCustomersButton } from "./delete-selected";
import { MergeSelectedCustomersButton } from "./merge-selected";
import { useCustomersTableFilters } from "./use-table-filters";

export function CustomersTableAction({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useCustomersTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const canDelete = hasPermission(user, "customer", "delete");
  const canMerge = hasPermission(user, "customer", "merge");

  return (
    <>
      <DataTableToolbar actions={actions}>
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </DataTableToolbar>
      {canDelete || canMerge ? (
        <SelectionActionBar
          count={rowSelection.length}
          primary={
            canDelete ? (
              <DeleteSelectedCustomersButton selected={rowSelection} />
            ) : undefined
          }
        >
          {canMerge ? (
            <MergeSelectedCustomersButton selected={rowSelection} />
          ) : null}
        </SelectionActionBar>
      ) : null}
    </>
  );
}
