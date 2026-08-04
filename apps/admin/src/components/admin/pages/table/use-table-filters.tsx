"use client";

import { pagesSearchParams } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function usePagesTableFilters() {
  const t = useI18n("admin");

  const STATUS_OPTIONS = [true, false].map((value) => ({
    value,
    label: value
      ? t("pages.table.filters.published")
      : t("pages.table.filters.draft"),
  }));

  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    pagesSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "published",
    pagesSearchParams.published
      .withOptions({ shallow: false })
      .withDefault(pagesSearchParams.published.defaultValue),
  );

  const [page, setPage] = useQueryState("page", pagesSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);

    setPage(1);
  }, [setSearchQuery, setStatusFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery || statusFilter !== pagesSearchParams.published.defaultValue
    );
  }, [searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    STATUS_OPTIONS,
  };
}
