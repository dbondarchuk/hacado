"use client";

import { discountsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useDiscountsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    discountsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    discountsSearchParams.type
      .withOptions({ shallow: false })
      .withDefault(discountsSearchParams.type.defaultValue),
  );

  const [enabledFilter, setEnabledFilter] = useQueryState(
    "enabled",
    discountsSearchParams.enabled
      .withOptions({ shallow: false })
      .withDefault(discountsSearchParams.enabled.defaultValue),
  );

  const [start, setStartValue] = useQueryState(
    "start",
    discountsSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    discountsSearchParams.end.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", discountsSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);
    setEnabledFilter(null);
    setStartValue(null);
    setEndValue(null);

    setPage(1);
  }, [
    setSearchQuery,
    setTypeFilter,
    setPage,
    setEnabledFilter,
    setStartValue,
    setEndValue,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery || typeFilter !== discountsSearchParams.type.defaultValue
    );
  }, [searchQuery, typeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeFilter,
    setTypeFilter,
    enabledFilter,
    setEnabledFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  };
}
