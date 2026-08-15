"use client";

import { paymentsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function usePaymentsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    paymentsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    paymentsSearchParams.type.withOptions({ shallow: false }),
  );

  const [methodFilter, setMethodFilter] = useQueryState(
    "method",
    paymentsSearchParams.method.withOptions({ shallow: false }),
  );

  const [customerFilter, setCustomerFilter] = useQueryState(
    "customerId",
    paymentsSearchParams.customerId.withOptions({ shallow: false }),
  );

  const [appointmentFilter, setAppointmentFilter] = useQueryState(
    "appointmentId",
    paymentsSearchParams.appointmentId.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", paymentsSearchParams.page);

  const [start, setStartValue] = useQueryState(
    "start",
    paymentsSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    paymentsSearchParams.end.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);
    setMethodFilter(null);
    setCustomerFilter(null);
    setAppointmentFilter(null);
    setStartValue(null);
    setEndValue(null);
    setPage(1);
  }, [
    setSearchQuery,
    setTypeFilter,
    setMethodFilter,
    setCustomerFilter,
    setAppointmentFilter,
    setStartValue,
    setEndValue,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      !!typeFilter?.length ||
      !!methodFilter?.length ||
      !!customerFilter?.length ||
      !!appointmentFilter?.length ||
      !!start ||
      !!end
    );
  }, [
    searchQuery,
    typeFilter,
    methodFilter,
    customerFilter,
    appointmentFilter,
    start,
    end,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeFilter,
    setTypeFilter,
    methodFilter,
    setMethodFilter,
    start,
    setStartValue,
    end,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    appointmentFilter,
    setAppointmentFilter,
  };
}
