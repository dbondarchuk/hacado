"use client";

import { ButtonGroup } from "@hacado/ui";
import {
  DataTableResetFilter,
  DataTableSearch,
  useAuth,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { DeleteSelectedCustomersButton } from "./delete-selected";
import { MergeSelectedCustomersButton } from "./merge-selected";
import { useCustomersTableFilters } from "./use-table-filters";

export function CustomersTableAction() {
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
      {canDelete || canMerge ? (
        <div className="flex flex-wrap items-center gap-4">
          <ButtonGroup>
            {canMerge ? (
              <MergeSelectedCustomersButton selected={rowSelection} />
            ) : null}
            {canDelete ? (
              <DeleteSelectedCustomersButton selected={rowSelection} />
            ) : null}
          </ButtonGroup>
        </div>
      ) : null}
    </div>
  );
}
