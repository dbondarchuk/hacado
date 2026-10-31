"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import { HeaderActionButtonsPortal } from "@hacado/ui-admin-kit/page";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
} from "@hacado/ui-admin/data-table";
import { Button } from "@hacado/ui/button";
import { ShoppingCart } from "lucide-react";
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
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
        <DataTableSearch
          searchKey={"search"}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder={t("purchases.table.searchPlaceholder")}
        />
        <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
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
