"use client";

import {
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import React from "react";
import { DeleteSelectedPageFootersButton } from "./delete-selected";
import { usePageFootersTableFilters } from "./use-table-filters";

export function PageFootersTableAction({
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
  } = usePageFootersTableFilters();

  const { rowSelection } = useSelectedRowsStore();

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
      <SelectionActionBar count={rowSelection.length}>
        <DeleteSelectedPageFootersButton selected={rowSelection} />
      </SelectionActionBar>
    </>
  );
}
