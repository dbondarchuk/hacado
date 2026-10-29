"use client";

import { giftCardsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useGiftCardsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    giftCardsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    giftCardsSearchParams.status
      .withOptions({ shallow: false })
      .withDefault(giftCardsSearchParams.status.defaultValue),
  );

  const [customerIdFilter, setCustomerIdFilter] = useQueryState(
    "customerId",
    giftCardsSearchParams.customerId.withOptions({ shallow: false }),
  );

  const [start, setStartValue] = useQueryState(
    "expiresAtStart",
    giftCardsSearchParams.expiresAtStart.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "expiresAtEnd",
    giftCardsSearchParams.expiresAtEnd.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", giftCardsSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setCustomerIdFilter(null);
    setStartValue(null);
    setEndValue(null);

    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setCustomerIdFilter,
    setPage,
    setStartValue,
    setEndValue,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      statusFilter !== giftCardsSearchParams.status.defaultValue ||
      !!customerIdFilter ||
      !!start ||
      !!end
    );
  }, [searchQuery, statusFilter, customerIdFilter, start, end]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    customerIdFilter,
    setCustomerIdFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  };
}
