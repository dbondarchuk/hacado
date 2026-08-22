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
  PackagesDataTableAsyncFilterBox,
  useAuth,
} from "@hacado/ui-admin";
import { canFilterByMember } from "@hacado/utils";
import { Settings2, X } from "lucide-react";
import React from "react";
import { useAppointmentsTableFilters } from "./use-table-filters";

export const AppointmentsTableAction: React.FC<{
  showCustomerFilter?: boolean;
  className?: string;
  soldPackageFilterName?: string | null;
}> = ({ showCustomerFilter, className, soldPackageFilterName }) => {
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
    packageFilter,
    setPackageFilter,
    customerPackageId,
    setCustomerPackageId,
  } = useAppointmentsTableFilters();

  const canUseDiscounts = useCanUseFeature("discounts");
  const canUsePackages = useCanUseFeature("packages");

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
      {canUsePackages && (
        <PackagesDataTableAsyncFilterBox
          filterKey="package"
          title={t("appointments.table.filters.package")}
          filterValue={packageFilter}
          setFilterValue={setPackageFilter}
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
    <div className={cn("flex flex-col gap-3", className)}>
      {customerPackageId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span>
            {t("appointments.table.filters.soldPackageActive", {
              name:
                soldPackageFilterName ??
                t("appointments.table.filters.soldPackageFallback"),
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => {
              void setCustomerPackageId(null);
              void setPage(1);
            }}
          >
            <X className="size-3.5" />
            {t("appointments.table.filters.clearSoldPackage")}
          </Button>
        </div>
      ) : null}
      <div className="flex flex-col flex-wrap md:items-center justify-between gap-4 md:flex-row">
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
          <div className="hidden md:flex flex-row gap-4">
            {additionalFilters}
          </div>
          <DataTableResetFilter
            isFilterActive={isAnyFilterActive}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
};
