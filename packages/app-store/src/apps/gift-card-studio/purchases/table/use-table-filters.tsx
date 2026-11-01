"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { searchParams } from "./search-params";

export function usePurchasesTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    searchParams.search
      .withOptions({ shallow: false, throttleMs: 500 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", searchParams.page);
  const [designIdFilter, setDesignIdFilter] = useQueryState(
    "designId",
    searchParams.designId,
  );

  const [customerIdFilter, setCustomerIdFilter] = useQueryState(
    "customerId",
    searchParams.customerId,
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setDesignIdFilter(null);
    setCustomerIdFilter(null);
    setPage(1);
  }, [setSearchQuery, setDesignIdFilter, setCustomerIdFilter, setPage]);

  const isAnyFilterActive = useMemo(
    () =>
      !!searchQuery ||
      (designIdFilter?.length ?? 0) > 0 ||
      (customerIdFilter?.length ?? 0) > 0,
    [searchQuery, designIdFilter, customerIdFilter],
  );

  return {
    searchQuery: searchQuery ?? "",
    setSearchQuery,
    page,
    setPage,
    designIdFilter: designIdFilter ?? [],
    setDesignIdFilter,
    customerIdFilter: customerIdFilter ?? [],
    setCustomerIdFilter,
    resetFilters,
    isAnyFilterActive,
  };
}
