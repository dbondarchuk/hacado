"use client";

import { useI18n } from "@hacado/i18n/client";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { searchParams } from "./search-params";

export function useFormsTableFilters() {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    searchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", searchParams.page);

  const [isArchivedFilter, setIsArchivedFilter] = useQueryState(
    "isArchived",
    searchParams.isArchived.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setIsArchivedFilter(null);
    setPage(1);
  }, [setSearchQuery, setIsArchivedFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    const defaultArchived = searchParams.isArchived.defaultValue;
    return (
      !!searchQuery ||
      JSON.stringify(isArchivedFilter ?? defaultArchived) !==
        JSON.stringify(defaultArchived)
    );
  }, [searchQuery, isArchivedFilter]);

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: false, label: t("forms.table.filters.public") },
      { value: true, label: t("forms.table.filters.archived") },
    ],
    [t],
  );

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    isArchivedFilter: isArchivedFilter ?? searchParams.isArchived.defaultValue,
    setIsArchivedFilter,
    STATUS_OPTIONS,
  };
}
