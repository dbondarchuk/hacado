"use client";

import { useI18n } from "@hacado/i18n/client";
import { customerPackageStatuses } from "@hacado/types/booking";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  PackagesDataTableAsyncFilterBox,
} from "@hacado/ui-admin/data-table";
import { useSoldPackagesTableFilters } from "./use-table-filters";

export function SoldPackagesTableAction() {
  const t = useI18n("admin");
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    customerIdFilter,
    setCustomerIdFilter,
    packageIdFilter,
    setPackageIdFilter,
    statusFilter,
    setStatusFilter,
  } = useSoldPackagesTableFilters();

  const additionalFilters = (
    <>
      <PackagesDataTableAsyncFilterBox
        filterKey="packageId"
        title={t("catalog.packages.sold.table.filters.package")}
        filterValue={packageIdFilter}
        setFilterValue={setPackageIdFilter}
      />
      <CustomersDataTableAsyncFilterBox
        filterKey="customerId"
        filterValue={customerIdFilter}
        setFilterValue={setCustomerIdFilter}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("catalog.packages.sold.table.columns.status")}
        options={customerPackageStatuses.map((status) => ({
          value: status,
          label: t(`catalog.packages.sold.statusBadges.${status}`),
        }))}
        setFilterValue={setStatusFilter as never}
        filterValue={statusFilter}
      />
    </>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
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
    </div>
  );
}
