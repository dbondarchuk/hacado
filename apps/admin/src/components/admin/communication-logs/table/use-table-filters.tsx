"use client";

import { communicationLogsSearchParams } from "@timelish/api-sdk";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useCommunicationLogsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    communicationLogsSearchParams.search
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [directionFilter, setDirectionFilter] = useQueryState(
    "direction",
    communicationLogsSearchParams.direction
      .withOptions({ shallow: false })
      .withDefault(communicationLogsSearchParams.direction.defaultValue),
  );

  const [channelFilter, setChannelFilter] = useQueryState(
    "channel",
    communicationLogsSearchParams.channel
      .withOptions({ shallow: false })
      .withDefault(communicationLogsSearchParams.channel.defaultValue),
  );

  const [participantTypeFilter, setParticipantTypeFilter] = useQueryState(
    "participantType",
    communicationLogsSearchParams.participantType
      .withOptions({ shallow: false })
      .withDefault(communicationLogsSearchParams.participantType.defaultValue),
  );

  const [customerFilter, setCustomerFilter] = useQueryState(
    "customer",
    communicationLogsSearchParams.customer.withOptions({ shallow: false }),
  );

  const [memberFilter, setMemberFilter] = useQueryState(
    "member",
    communicationLogsSearchParams.member.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState(
    "page",
    communicationLogsSearchParams.page,
  );

  const [start, setStartValue] = useQueryState(
    "start",
    communicationLogsSearchParams.start.withOptions({ shallow: false }),
  );

  const [end, setEndValue] = useQueryState(
    "end",
    communicationLogsSearchParams.end.withOptions({ shallow: false }),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setDirectionFilter(null);
    setChannelFilter(null);
    setParticipantTypeFilter(null);
    setStartValue(null);
    setEndValue(null);
    setCustomerFilter(null);
    setMemberFilter(null);

    setPage(1);
  }, [
    setSearchQuery,
    setDirectionFilter,
    setChannelFilter,
    setParticipantTypeFilter,
    setPage,
    setStartValue,
    setEndValue,
    setCustomerFilter,
    setMemberFilter,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      directionFilter !==
        communicationLogsSearchParams.direction.defaultValue ||
      channelFilter !== communicationLogsSearchParams.channel.defaultValue ||
      participantTypeFilter !==
        communicationLogsSearchParams.participantType.defaultValue ||
      !!start ||
      !!end ||
      !!memberFilter?.length
    );
  }, [
    searchQuery,
    directionFilter,
    channelFilter,
    participantTypeFilter,
    start,
    end,
    memberFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    directionFilter,
    setDirectionFilter,
    channelFilter,
    setChannelFilter,
    participantTypeFilter,
    setParticipantTypeFilter,
    start,
    setStartValue,
    end,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    memberFilter,
    setMemberFilter,
  };
}
