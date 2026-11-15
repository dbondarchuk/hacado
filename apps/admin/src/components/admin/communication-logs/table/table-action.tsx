"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  communicationChannels,
  communicationDirectionSchema,
  communicationLogStatuses,
  communicationParticipantTypeSchema,
} from "@hacado/types/communication";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import { useAuth } from "@hacado/ui-admin/context";
import {
  CustomersDataTableAsyncFilterBox,
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  MembersDataTableAsyncFilterBox,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import { canFilterCommunicationByMember } from "@hacado/utils/permissions";
import { X } from "lucide-react";

import React from "react";
import { ClearAllCommunicationLogsButton } from "./clear-all";
import { ClearSelectedCommunicationLogsButton } from "./clear-selected";
import { useCommunicationLogsTableFilters } from "./use-table-filters";

export const CommunicationLogsTableAction: React.FC<{
  allowClearAll?: boolean;
  showCustomerFilter?: boolean;
  showParticipantTypeFilter?: boolean;
  className?: string;
  actions?: React.ReactNode;
}> = ({
  allowClearAll,
  showCustomerFilter,
  showParticipantTypeFilter,
  className,
  actions,
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
    idFilter,
    setIdFilter,
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

  const toolbarActions =
    allowClearAll || actions ? (
      <>
        {allowClearAll ? <ClearAllCommunicationLogsButton /> : null}
        {actions}
      </>
    ) : undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {idFilter ? (
        <div className="flex min-w-0 flex-nowrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate">
            {t("communicationLogs.table.filters.logIdActive", {
              id: idFilter,
            })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2"
            aria-label={t("communicationLogs.table.filters.clearLogId")}
            onClick={() => {
              void setIdFilter(null);
              void setPage(1);
            }}
          >
            <X className="size-3.5" />
            <span className="ml-1 hidden sm:inline">
              {t("communicationLogs.table.filters.clearLogId")}
            </span>
          </Button>
        </div>
      ) : null}
      <DataTableToolbar actions={toolbarActions}>
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
      </DataTableToolbar>
      <SelectionActionBar count={rowSelection.length}>
        <ClearSelectedCommunicationLogsButton selected={rowSelection} />
      </SelectionActionBar>
    </div>
  );
};
