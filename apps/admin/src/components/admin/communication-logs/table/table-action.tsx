"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  communicationChannels,
  communicationDirectionSchema,
  communicationLogStatuses,
  communicationParticipantTypeSchema,
} from "@hacado/types/communication";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";
import { useAuth } from "@hacado/ui-admin/context";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  MembersDataTableAsyncFilterBox,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { cn } from "@hacado/ui/cn";
import { canFilterCommunicationByMember } from "@hacado/utils";

import React from "react";
import { ClearAllCommunicationLogsButton } from "./clear-all";
import { ClearSelectedCommunicationLogsButton } from "./clear-selected";
import { useCommunicationLogsTableFilters } from "./use-table-filters";

export const CommunicationLogsTableAction: React.FC<{
  allowClearAll?: boolean;
  hideActions?: boolean;
  showCustomerFilter?: boolean;
  showParticipantTypeFilter?: boolean;
  className?: string;
}> = ({
  allowClearAll,
  showCustomerFilter,
  showParticipantTypeFilter,
  hideActions = true,
  className,
}) => {
  const {
    directionFilter,
    channelFilter,
    statusFilter,
    participantTypeFilter,
    setDirectionFilter,
    setChannelFilter,
    setStatusFilter,
    setParticipantTypeFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    start,
    end,
    setStartValue,
    setEndValue,
    customerFilter,
    setCustomerFilter,
    memberFilter,
    setMemberFilter,
  } = useCommunicationLogsTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const showMemberFilter = canFilterCommunicationByMember(user);
  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="direction"
        title={t("communicationLogs.table.filters.direction")}
        options={communicationDirectionSchema.map((direction) => ({
          value: direction,
          label: t(`common.labels.direction.${direction}`),
        }))}
        setFilterValue={setDirectionFilter as any}
        filterValue={directionFilter}
      />
      <DataTableFilterBox
        filterKey="channel"
        title={t("communicationLogs.table.filters.channel")}
        options={communicationChannels.map((channel) => ({
          value: channel,
          label: t(`common.labels.channel.${channel}`),
        }))}
        setFilterValue={setChannelFilter as any}
        filterValue={channelFilter}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("communicationLogs.table.filters.status")}
        options={communicationLogStatuses.map((status) => ({
          value: status,
          label: t(`communications.status.${status}`),
        }))}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
      {showParticipantTypeFilter && (
        <DataTableFilterBox
          filterKey="participantType"
          title={t("communicationLogs.table.filters.participant")}
          options={communicationParticipantTypeSchema.map(
            (participantType) => ({
              value: participantType,
              label: t(`common.labels.participantType.${participantType}`),
            }),
          )}
          setFilterValue={setParticipantTypeFilter as any}
          filterValue={participantTypeFilter}
        />
      )}
      {showMemberFilter ? (
        <MembersDataTableAsyncFilterBox
          title={t("communicationLogs.table.filters.member")}
          filterValue={memberFilter || []}
          setFilterValue={setMemberFilter as any}
        />
      ) : null}
      {showCustomerFilter && (
        <CustomersDataTableAsyncFilterBox
          filterValue={customerFilter}
          setFilterValue={setCustomerFilter}
        />
      )}
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
    </>
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-wrap items-center gap-2",
        className,
      )}
    >
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-2">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      {!hideActions && (
        <div className="flex flex-wrap items-center gap-4">
          <ClearSelectedCommunicationLogsButton selected={rowSelection} />
          {allowClearAll && <ClearAllCommunicationLogsButton />}
        </div>
      )}
    </div>
  );
};
