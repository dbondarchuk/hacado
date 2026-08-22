"use client";

import { useI18n } from "@hacado/i18n/client";
import { customerPackageStatuses } from "@hacado/types";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  PackagesDataTableAsyncFilterBox,
} from "@hacado/ui-admin";
import { Settings2, ShoppingCart } from "lucide-react";
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
        title={t("services.packages.sold.table.filters.package")}
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
        title={t("services.packages.sold.table.columns.status")}
        options={customerPackageStatuses.map((status) => ({
          value: status,
          label: t(`services.packages.sold.statusBadges.${status}`),
        }))}
        setFilterValue={setStatusFilter as never}
        filterValue={statusFilter}
      />
    </>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <Popover>
          <PopoverTrigger asChild className="md:hidden">
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
      <Button
        type="button"
        onClick={() => setSellOpen(true)}
        aria-label={t("services.packages.sell")}
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="max-md:hidden">{t("services.packages.sell")}</span>
      </Button>
      <SellPackageDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
