"use client";

import { useCanUseFeature } from "@/lib/billing/use-subscription-plan-access";
import { useI18n } from "@hacado/i18n/client";
import { appointmentStatuses } from "@hacado/types";
import {
  Button,
  cn,
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
  DiscountsDataTableAsyncFilterBox,
  MembersDataTableAsyncFilterBox,
  useAuth,
} from "@hacado/ui-admin";
import { canFilterByMember } from "@hacado/utils";
import { Settings2 } from "lucide-react";
import React from "react";
import { useAppointmentsTableFilters } from "./use-table-filters";

export const AppointmentsTableAction: React.FC<{
  showCustomerFilter?: boolean;
  className?: string;
}> = ({ showCustomerFilter, className }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const showMemberFilter = canFilterByMember(user);
  const {
    statusFilter,
    setStatusFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    start,
    end,
    setStartValue,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    discountFilter,
    setDiscountFilter,
    memberFilter,
    setMemberFilter,
  } = useAppointmentsTableFilters();

  const canUseDiscounts = useCanUseFeature("discounts");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="status"
        title={t("appointments.table.filters.status")}
        options={appointmentStatuses.map((value) => ({
          value,
          label: t(`appointments.status.${value}`),
        }))}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
      {showCustomerFilter && (
        <CustomersDataTableAsyncFilterBox
          filterValue={customerFilter}
          setFilterValue={setCustomerFilter}
        />
      )}
      {canUseDiscounts && (
        <DiscountsDataTableAsyncFilterBox
          filterValue={discountFilter}
          setFilterValue={setDiscountFilter}
        />
      )}
      {showMemberFilter ? (
        <MembersDataTableAsyncFilterBox
          filterValue={memberFilter || []}
          setFilterValue={setMemberFilter as any}
        />
      ) : null}
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
    </div>
  );
};
