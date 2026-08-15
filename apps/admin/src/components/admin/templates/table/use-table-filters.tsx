"use client";

import { templateSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useTemplatesTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    templateSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    templateSearchParams.type
      .withOptions({ shallow: false })
      .withDefault(templateSearchParams.type.defaultValue),
  );

  const [page, setPage] = useQueryState("page", templateSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);

    setPage(1);
  }, [setSearchQuery, setPage, setTypeFilter]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery || typeFilter !== templateSearchParams.type.defaultValue
    );
  }, [searchQuery, typeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
  };
}
