"use client";

import { useI18n } from "@timelish/i18n/client";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { searchParams } from "./search-params";

export function useDesignsTableFilters() {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

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
      { value: false, label: t("designs.table.filters.active") },
      { value: true, label: t("designs.table.filters.archived") },
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
