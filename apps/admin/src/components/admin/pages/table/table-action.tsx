"use client";

import { useI18n } from "@hacado/i18n/client";

import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";

import { DeleteSelectedPagesButton } from "./delete-selected";
import { usePagesTableFilters } from "./use-table-filters";

export function PagesTableAction() {
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
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
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
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <DeleteSelectedPagesButton selected={rowSelection} />
      </div>
    </div>
  );
}
