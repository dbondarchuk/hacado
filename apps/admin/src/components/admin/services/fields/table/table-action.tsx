"use client";

import { useI18n } from "@hacado/i18n/client";
import { fieldTypes } from "@hacado/types";

import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useAuth,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";
import { hasPermission } from "@hacado/utils";

import { DeleteSelectedFieldsButton } from "./delete-selected";
import { useFieldsTableFilters } from "./use-table-filters";

export function FieldsTableAction() {
  const {
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useFieldsTableFilters();
  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const canDelete = hasPermission(user, "service", "delete");
  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("services.fields.table.columns.type")}
        options={fieldTypes.map((type) => ({
          value: type,
          label: t(`common.labels.fieldType.${type}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
    </>
  );

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-wrap items-center gap-4">
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
      {canDelete ? (
        <div className="flex flex-wrap items-center gap-4">
          <DeleteSelectedFieldsButton selected={rowSelection} />
        </div>
      ) : null}
    </div>
  );
}
