"use client";

import { pageHeadersSearchParams } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function usePageHeadersTableFilters() {
  const t = useI18n("admin");

  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    pageHeadersSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", pageHeadersSearchParams.page);

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
