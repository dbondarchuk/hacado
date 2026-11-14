"use client";

import { useI18n } from "@hacado/i18n/client";
import { communicationChannels } from "@hacado/types/communication";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  TableToolbarActionLabel,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { Link } from "@hacado/ui/link";
import { Plus } from "lucide-react";
import React from "react";
import { appointmentReminderTypes } from "../models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "../translations/types";
import { DeleteSelectedAppointmentRemindersButton } from "./delete-selected";
import { useAppointmentRemindersTableFilters } from "./use-table-filters";

export const AppointmentRemindersTableAction: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const tAdmin = useI18n("admin");

  const {
    channelFilter,
    setChannelFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
  } = useAppointmentRemindersTableFilters();

  const { rowSelection } = useSelectedRowsStore();

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="channel"
        title={t("table.columns.channel")}
        options={communicationChannels.map((value) => ({
          value,
          label: tAdmin(`common.labels.channel.${value}`),
        }))}
        setFilterValue={setChannelFilter as any}
        filterValue={channelFilter}
      />
      <DataTableFilterBox
        filterKey="type"
        title={t("table.columns.type")}
        options={appointmentReminderTypes.map((value) => ({
          value,
          label: t(`triggers.${value}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
    </>
  );

  const toolbarActions = (
    <Link
      button
      size="sm"
      variant="primary"
      href="/dashboard/communications/appointment-reminders/new"
      aria-label={t("table.actions.add")}
    >
      <Plus size={16} />
      <TableToolbarActionLabel>
        {t("table.actions.add")}
      </TableToolbarActionLabel>
    </Link>
  );

  return (
    <>
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
        <DeleteSelectedAppointmentRemindersButton
          selected={rowSelection}
          appId={appId}
        />
      </SelectionActionBar>
    </>
  );
};
