"use client";

import { activitiesSearchParams } from "@hacado/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useActivityTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    activitiesSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState("page", activitiesSearchParams.page);

  const [severityFilter, setSeverityFilter] = useQueryState(
    "severity",
    activitiesSearchParams.severity.withOptions({ shallow: false }),
  );

  const [actorFilter, setActorFilter] = useQueryState(
    "actor",
    activitiesSearchParams.actor.withOptions({ shallow: false }),
  );

  const [eventTypeFilter, setEventTypeFilter] = useQueryState(
    "eventType",
    activitiesSearchParams.eventType.withOptions({ shallow: false }),
  );

  const [start, setStart] = useQueryState(
    "start",
    activitiesSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEnd] = useQueryState(
    "end",
    activitiesSearchParams.end.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setSeverityFilter(null);
    setActorFilter(null);
    setEventTypeFilter(null);
    setStart(null);
    setEnd(null);
    setPage(1);
  }, [
    setSearchQuery,
    setSeverityFilter,
    setActorFilter,
    setEventTypeFilter,
    setStart,
    setEnd,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      !!severityFilter?.length ||
      !!actorFilter?.length ||
      !!eventTypeFilter?.length ||
      !!start ||
      !!end
    );
  }, [searchQuery, severityFilter, actorFilter, eventTypeFilter, start, end]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    severityFilter,
    setSeverityFilter,
    actorFilter,
    setActorFilter,
    eventTypeFilter,
    setEventTypeFilter,
    start,
    setStart,
    end,
    setEnd,
    resetFilters,
    isAnyFilterActive,
  };
}
