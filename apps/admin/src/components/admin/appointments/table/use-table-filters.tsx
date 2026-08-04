"use client";

import { appointmentsSearchParams } from "@timelish/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useAppointmentsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    appointmentsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    appointmentsSearchParams.status
      .withOptions({ shallow: false })
      .withDefault(appointmentsSearchParams.status.defaultValue),
  );

  const [customerFilter, setCustomerFilter] = useQueryState(
    "customer",
    appointmentsSearchParams.customer.withOptions({ shallow: false }),
  );

  const [discountFilter, setDiscountFilter] = useQueryState(
    "discount",
    appointmentsSearchParams.discount.withOptions({ shallow: false }),
  );

  const [memberFilter, setMemberFilter] = useQueryState(
    "member",
    appointmentsSearchParams.member.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", appointmentsSearchParams.page);

  const [start, setStartValue] = useQueryState(
    "start",
    appointmentsSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    appointmentsSearchParams.end.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setStartValue(null);
    setEndValue(null);
    setCustomerFilter(null);
    setDiscountFilter(null);
    setMemberFilter(null);

    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setStartValue,
    setEndValue,
    setCustomerFilter,
    setDiscountFilter,
    setMemberFilter,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      statusFilter !== appointmentsSearchParams.status.defaultValue ||
      !!start ||
      !!end ||
      !!customerFilter ||
      !!discountFilter ||
      !!memberFilter
    );
  }, [
    searchQuery,
    statusFilter,
    start,
    end,
    customerFilter,
    discountFilter,
    memberFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    start,
    setStartValue,
    end,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    discountFilter,
    setDiscountFilter,
    memberFilter,
    setMemberFilter,
  };
}
