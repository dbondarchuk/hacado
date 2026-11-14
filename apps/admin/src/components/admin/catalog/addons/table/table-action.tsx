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
import { DeleteSelectedAddonsButton } from "./delete-selected";
import { useAddonsTableFilters } from "./use-table-filters";

export function AddonsTableAction({ actions }: { actions?: React.ReactNode }) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useAddonsTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const canDelete = hasPermission(user, "service", "delete");

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
      {canDelete ? (
        <SelectionActionBar count={rowSelection.length}>
          <DeleteSelectedAddonsButton selected={rowSelection} />
        </SelectionActionBar>
      ) : null}
    </>
  );
}
