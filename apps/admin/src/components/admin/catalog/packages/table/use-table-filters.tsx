"use client";

import { packagesSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

export function usePackagesTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    packagesSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );
  const [page, setPage] = useQueryState("page", packagesSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setPage(1);
  }, [setSearchQuery, setPage]);

  return {
    searchQuery,
    setSearchQuery,
    setPage,
    resetFilters,
    isAnyFilterActive: !!searchQuery,
  };
}
