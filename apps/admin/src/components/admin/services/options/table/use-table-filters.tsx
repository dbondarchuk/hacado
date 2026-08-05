"use client";

import { serviceOptionsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useAddonsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    serviceOptionsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState(
    "page",
    serviceOptionsSearchParams.page,
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);

    setPage(1);
  }, [setSearchQuery, setPage]);

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
  };
}
