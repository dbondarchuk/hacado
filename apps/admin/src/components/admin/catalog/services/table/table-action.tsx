"use client";

import { useAuth } from "@hacado/ui-admin/context";
import {
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { hasPermission } from "@hacado/utils/permissions";
import { DeleteSelectedServicesButton } from "./delete-selected";
import { useAddonsTableFilters } from "./use-table-filters";

export function ServicesTableAction() {
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
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
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
      </div>
      {canDelete ? (
        <div className="flex flex-wrap items-center gap-4">
          <DeleteSelectedServicesButton selected={rowSelection} />
        </div>
      ) : null}
    </div>
  );
}
