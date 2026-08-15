"use client";

import { serviceFieldsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useFieldsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    serviceFieldsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    serviceFieldsSearchParams.type
      .withOptions({ shallow: false })
      .withDefault(serviceFieldsSearchParams.type.defaultValue),
  );

  const [page, setPage] = useQueryState("page", serviceFieldsSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);

    setPage(1);
  }, [setSearchQuery, setTypeFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      typeFilter !== serviceFieldsSearchParams.type.defaultValue
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
  };
}
