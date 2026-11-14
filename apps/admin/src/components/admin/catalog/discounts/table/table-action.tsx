"use client";

import { useI18n } from "@hacado/i18n/client";
import { discountTypes } from "@hacado/types/booking";

import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import React from "react";

import { DeleteSelectedDiscountsButton } from "./delete-selected";
import { useDiscountsTableFilters } from "./use-table-filters";

export function DiscountsTableAction({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const {
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    enabledFilter,
    setEnabledFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useDiscountsTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("catalog.discounts.table.columns.type")}
        options={discountTypes.map((type) => ({
          value: type,
          label: t(`common.labels.discountType.${type}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("catalog.discounts.table.columns.enabled")}
        options={[
          {
            value: false,
            label: t("common.labels.discountStatus.disabled"),
          },
          {
            value: true,
            label: t("common.labels.discountStatus.active"),
          },
        ]}
        setFilterValue={setEnabledFilter as any}
        filterValue={enabledFilter}
      />
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
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
        <DeleteSelectedDiscountsButton selected={rowSelection} />
      </SelectionActionBar>
    </>
  );
}
