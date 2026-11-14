"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  TableToolbarActionLabel,
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

  const toolbarActions = (
    <Button
      onClick={onOpenManualPurchase}
      variant="default"
      size="sm"
      aria-label={t("purchases.table.actions.create")}
    >
      <ShoppingCart size={16} />
      <TableToolbarActionLabel>
        {t("purchases.table.actions.create")}
      </TableToolbarActionLabel>
    </Button>
  );

  return (
    <DataTableToolbar actions={toolbarActions}>
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
    </DataTableToolbar>
  );
};
