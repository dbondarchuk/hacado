"use client";

import { teamsSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useTeamMembersTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    teamsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    teamsSearchParams.status
      .withOptions({ shallow: false })
      .withDefault(teamsSearchParams.status.defaultValue),
  );

  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    teamsSearchParams.role.withOptions({ shallow: false }),
  );

  const [start, setStartValue] = useQueryState(
    "start",
    teamsSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    teamsSearchParams.end.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState("page", teamsSearchParams.page);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setRoleFilter(null);
    setStartValue(null);
    setEndValue(null);
    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setRoleFilter,
    setStartValue,
    setEndValue,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      statusFilter !== teamsSearchParams.status.defaultValue ||
      !!roleFilter?.length ||
      !!start ||
      !!end
    );
  }, [searchQuery, statusFilter, roleFilter, start, end]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  };
}
