"use client";

import { useI18n } from "@hacado/i18n/client";
import { giftCardStatus } from "@hacado/types";
import {
  Button,
  ButtonGroup,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { Settings2 } from "lucide-react";
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
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <Popover>
          <PopoverTrigger
            tooltip={t("common.labels.filters")}
            asChild
            className="md:hidden"
          >
            <Button variant="outline">
              <Settings2 size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-2">
            {additionalFilters}
          </PopoverContent>
        </Popover>
        <div className="hidden md:flex flex-row gap-4">{additionalFilters}</div>
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
