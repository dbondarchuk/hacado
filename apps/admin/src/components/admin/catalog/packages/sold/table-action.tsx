"use client";

import { useI18n } from "@hacado/i18n/client";
import { customerPackageStatuses } from "@hacado/types";
import { Button } from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  PackagesDataTableAsyncFilterBox,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { SellPackageDialog } from "../sell-dialog";
import { useSoldPackagesTableFilters } from "./use-table-filters";

export function SoldPackagesTableAction() {
  const t = useI18n("admin");
  const router = useRouter();
  const [sellOpen, setSellOpen] = React.useState(false);
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
      <Button
        type="button"
        onClick={() => setSellOpen(true)}
        aria-label={t("catalog.packages.sell")}
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="max-md:hidden">{t("catalog.packages.sell")}</span>
      </Button>
      <SellPackageDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
