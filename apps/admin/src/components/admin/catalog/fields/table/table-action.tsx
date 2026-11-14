"use client";

import { useI18n } from "@hacado/i18n/client";
import { fieldTypes } from "@hacado/types/booking";

import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import { useAuth } from "@hacado/ui-admin/context";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { hasPermission } from "@hacado/utils/permissions";
import React from "react";

import { DeleteSelectedFieldsButton } from "./delete-selected";
import { useFieldsTableFilters } from "./use-table-filters";

export function FieldsTableAction({ actions }: { actions?: React.ReactNode }) {
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
        title={t("catalog.fields.table.columns.type")}
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
      {canDelete ? (
        <SelectionActionBar count={rowSelection.length}>
          <DeleteSelectedFieldsButton selected={rowSelection} />
        </SelectionActionBar>
      ) : null}
    </>
  );
}
