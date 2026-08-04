"use client";

import { pageFootersSearchParams } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function usePageFootersTableFilters() {
  const t = useI18n("admin");

  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    pageFootersSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", pageFootersSearchParams.page);

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
