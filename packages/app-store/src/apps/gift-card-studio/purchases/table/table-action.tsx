"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@hacado/ui";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
} from "@hacado/ui-admin";
import { HeaderActionButtonsPortal } from "@hacado/ui-admin-kit";
import { Settings2, ShoppingCart } from "lucide-react";
import React from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { DesignsDataTableAsyncFilterBox } from "./designs-filter-box";
import { usePurchasesTableFilters } from "./use-table-filters";

export const PurchasesTableAction: React.FC<{
  appId: string;
  onOpenManualPurchase?: () => void;
}> = ({ appId, onOpenManualPurchase }) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const {
    designIdFilter,
    setDesignIdFilter,
    customerIdFilter,
    setCustomerIdFilter,
    resetFilters,
    isAnyFilterActive,
    searchQuery,
    setSearchQuery,
    setPage,
  } = usePurchasesTableFilters();

  const additionalFilters = (
    <>
      <DesignsDataTableAsyncFilterBox
        appId={appId}
        filterKey="designId"
        filterValue={designIdFilter}
        setFilterValue={setDesignIdFilter}
      />
      <CustomersDataTableAsyncFilterBox
        filterKey="customerId"
        title={t("purchases.table.filters.customer")}
        filterValue={customerIdFilter}
        setFilterValue={setCustomerIdFilter}
      />
    </>
  );

  return (
    <div className="flex flex-col flex-wrap md:items-center justify-between gap-4 md:flex-row">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey={"search"}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder={t("purchases.table.searchPlaceholder")}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="md:hidden">
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
      <HeaderActionButtonsPortal>
        <Button
          onClick={onOpenManualPurchase}
          variant="default"
          aria-label={t("purchases.table.actions.create")}
        >
          <ShoppingCart size={16} />
          <span className="max-md:hidden">
            {t("purchases.table.actions.create")}
          </span>
        </Button>
      </HeaderActionButtonsPortal>
    </div>
  );
};
