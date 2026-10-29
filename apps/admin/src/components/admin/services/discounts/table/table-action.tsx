"use client";

import { useI18n } from "@hacado/i18n/client";
import { discountTypes } from "@hacado/types";

import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";

import { DeleteSelectedDiscountsButton } from "./delete-selected";
import { useDiscountsTableFilters } from "./use-table-filters";

export function DiscountsTableAction() {
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
        title={t("services.discounts.table.columns.type")}
        options={discountTypes.map((type) => ({
          value: type,
          label: t(`common.labels.discountType.${type}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("services.discounts.table.columns.enabled")}
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
        <DeleteSelectedDiscountsButton selected={rowSelection} />
      </div>
    </div>
  );
}
