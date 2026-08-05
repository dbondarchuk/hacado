"use client";

import { assetsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useAssetsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    assetsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", assetsSearchParams.page);

  const [customerFilter, setCustomerFilter] = useQueryState(
    "customerId",
    assetsSearchParams.customerId.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setCustomerFilter(null);

    setPage(1);
  }, [setSearchQuery, setPage, setCustomerFilter]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery;
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    customerFilter,
    setCustomerFilter,
  };
}
