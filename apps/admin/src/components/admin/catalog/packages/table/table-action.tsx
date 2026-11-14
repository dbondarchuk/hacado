"use client";

import {
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
} from "@hacado/ui-admin/data-table";
import React from "react";
import { usePackagesTableFilters } from "./use-table-filters";

export function PackagesTableAction({
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
  } = usePackagesTableFilters();

  return (
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
  );
}
