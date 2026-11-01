"use client";

import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { searchParams } from "./search-params";

export function useAppointmentNotificationsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    searchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [channelFilter, setChannelFilter] = useQueryState(
    "channel",
    searchParams.channel
      .withOptions({ shallow: false })
      .withDefault(searchParams.channel.defaultValue),
  );

  const [page, setPage] = useQueryState("page", searchParams.page);
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    searchParams.type
      .withOptions({ shallow: false })
      .withDefault(searchParams.type.defaultValue),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setChannelFilter(null);
    setTypeFilter(null);
    setPage(1);
  }, [setSearchQuery, setChannelFilter, setPage, setTypeFilter]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      channelFilter !== searchParams.channel.defaultValue ||
      typeFilter !== searchParams.type.defaultValue
    );
  }, [searchQuery, channelFilter, typeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    channelFilter,
    setChannelFilter,
    typeFilter,
    setTypeFilter,
  };
}
