"use client";

import { useI18n } from "@hacado/i18n/client";
import { giftCardStatus } from "@hacado/types";
import { ButtonGroup } from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";

import { DeleteSelectedGiftCardsButton } from "./delete-selected";
import { SetStatusSelectedGiftCardsButton } from "./set-status-selected";
import { useGiftCardsTableFilters } from "./use-table-filters";

export function GiftCardsTableAction() {
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
        title={t("services.giftCards.table.columns.status")}
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
        title={t("services.giftCards.table.columns.expiresAt")}
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
        <ButtonGroup>
          <SetStatusSelectedGiftCardsButton
            selected={rowSelection}
            status="active"
          />
          <SetStatusSelectedGiftCardsButton
            selected={rowSelection}
            status="inactive"
          />
          <DeleteSelectedGiftCardsButton selected={rowSelection} />
        </ButtonGroup>
      </div>
    </div>
  );
}
