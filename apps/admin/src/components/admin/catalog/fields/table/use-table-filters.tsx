"use client";

import { fieldsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useFieldsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    fieldsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    fieldsSearchParams.type
      .withOptions({ shallow: false })
      .withDefault(fieldsSearchParams.type.defaultValue),
  );

  const [page, setPage] = useQueryState("page", fieldsSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);

    setPage(1);
  }, [setSearchQuery, setTypeFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || typeFilter !== fieldsSearchParams.type.defaultValue;
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
