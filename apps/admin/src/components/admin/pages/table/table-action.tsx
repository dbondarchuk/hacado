"use client";

import { useI18n } from "@hacado/i18n/client";

import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import React from "react";
import { DeleteSelectedPagesButton } from "./delete-selected";
import { usePagesTableFilters } from "./use-table-filters";

export function PagesTableAction({ actions }: { actions?: React.ReactNode }) {
  const t = useI18n("admin");
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    STATUS_OPTIONS,
  } = usePagesTableFilters();

  const { rowSelection } = useSelectedRowsStore();

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="status"
        title={t("pages.table.filters.status")}
        options={STATUS_OPTIONS}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
    </>
  );

  return (
    <>
      <DataTableToolbar actions={actions}>
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </DataTableToolbar>
      <SelectionActionBar count={rowSelection.length}>
        <DeleteSelectedPagesButton selected={rowSelection} />
      </SelectionActionBar>
    </>
  );
}
