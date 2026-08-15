"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { searchParams } from "./search-params";

export function useWaitlistTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    searchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    searchParams.status
      .withOptions({ shallow: false })
      .withDefault(searchParams.status.defaultValue),
  );

  const [customerFilter, setCustomerFilter] = useQueryState(
    "customer",
    searchParams.customer.withOptions({ shallow: false }),
  );
  const [optionFilter, setOptionFilter] = useQueryState(
    "option",
    searchParams.option.withOptions({ shallow: false }),
  );

  const [memberFilter, setMemberFilter] = useQueryState(
    "member",
    searchParams.member.withOptions({ shallow: false }),
  );

  const [start, setStartValue] = useQueryState(
    "start",
    searchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    searchParams.end.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", searchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setCustomerFilter(null);
    setOptionFilter(null);
    setMemberFilter(null);
    setStartValue(null);
    setEndValue(null);
    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setCustomerFilter,
    setOptionFilter,
    setMemberFilter,
    setStartValue,
    setEndValue,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      statusFilter !== searchParams.status.defaultValue ||
      !!customerFilter?.length ||
      !!optionFilter?.length ||
      !!memberFilter?.length ||
      !!start ||
      !!end
    );
  }, [
    searchQuery,
    statusFilter,
    customerFilter,
    optionFilter,
    memberFilter,
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
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    optionFilter,
    setOptionFilter,
    memberFilter,
    setMemberFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  };
}
