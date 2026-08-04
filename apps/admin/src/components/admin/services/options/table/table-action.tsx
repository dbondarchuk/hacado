"use client";

import {
  DataTableResetFilter,
  DataTableSearch,
  useAuth,
  useSelectedRowsStore,
} from "@timelish/ui-admin";
import { hasPermission } from "@timelish/utils";
import { DeleteSelectedOptionsButton } from "./delete-selected";
import { useAddonsTableFilters } from "./use-table-filters";

export function OptionsTableAction() {
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
          <DeleteSelectedOptionsButton selected={rowSelection} />
        </div>
      ) : null}
    </div>
  );
}
