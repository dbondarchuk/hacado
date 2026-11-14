"use client";

import { useI18n } from "@hacado/i18n/client";
import { giftCardStatus } from "@hacado/types/booking";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { ButtonGroup } from "@hacado/ui/button-group";
import React from "react";

import { DeleteSelectedGiftCardsButton } from "./delete-selected";
import { SetStatusSelectedGiftCardsButton } from "./set-status-selected";
import { useGiftCardsTableFilters } from "./use-table-filters";

export function GiftCardsTableAction({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    customerIdFilter,
    setCustomerIdFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useGiftCardsTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="status"
        title={t("catalog.giftCards.table.columns.status")}
        options={giftCardStatus.map((status) => ({
          value: status,
          label: t(`common.labels.giftCardStatus.${status}`),
        }))}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
      <CustomersDataTableAsyncFilterBox
        filterKey="customerId"
        filterValue={customerIdFilter}
        setFilterValue={setCustomerIdFilter}
      />
      <DataTableRangeBox
        title={t("catalog.giftCards.table.columns.expiresAt")}
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
      <SelectionActionBar
        count={rowSelection.length}
        primary={<DeleteSelectedGiftCardsButton selected={rowSelection} />}
      >
        <ButtonGroup>
          <SetStatusSelectedGiftCardsButton
            selected={rowSelection}
            status="active"
          />
          <SetStatusSelectedGiftCardsButton
            selected={rowSelection}
            status="inactive"
          />
        </ButtonGroup>
      </SelectionActionBar>
    </>
  );
}
