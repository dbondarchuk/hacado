"use client";

import { useI18n } from "@hacado/i18n/client";
import { paymentMethods, paymentType } from "@hacado/types";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import {
  AppointmentsDataTableAsyncFilterBox,
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
} from "@hacado/ui-admin";
import { Settings2 } from "lucide-react";
import React from "react";
import { ExportPaymentsButton } from "./export-payments-button";
import { usePaymentsTableFilters } from "./use-table-filters";

export const PaymentsTableAction: React.FC<{
  className?: string;
}> = ({ className }) => {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setSearchQuery,
    setPage,
    typeFilter,
    setTypeFilter,
    methodFilter,
    setMethodFilter,
    start,
    end,
    setStartValue,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    appointmentFilter,
    setAppointmentFilter,
  } = usePaymentsTableFilters();

  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("paymentsList.columns.type")}
        options={paymentType.map((type) => ({
          value: type,
          label: t(`payment.types.${type}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter ?? []}
      />
      <DataTableFilterBox
        filterKey="method"
        title={t("paymentsList.columns.method")}
        options={paymentMethods.map((method) => ({
          value: method,
          label: t(`common.labels.paymentMethod.${method}`),
        }))}
        setFilterValue={setMethodFilter as any}
        filterValue={methodFilter ?? []}
      />
      <CustomersDataTableAsyncFilterBox
        filterValue={customerFilter}
        setFilterValue={setCustomerFilter}
        maxAmount={1}
      />
      <AppointmentsDataTableAsyncFilterBox
        filterValue={appointmentFilter}
        setFilterValue={setAppointmentFilter}
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
    <div
      className={cn(
        "flex flex-col flex-wrap md:items-center justify-between gap-4 md:flex-row",
        className,
      )}
    >
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="search"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder={t("paymentsList.table.filters.searchPlaceholder")}
        />
        <Popover>
          <PopoverTrigger
            tooltip={t("communicationLogs.table.filters.filters")}
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
        <ExportPaymentsButton />
      </div>
    </div>
  );
};
