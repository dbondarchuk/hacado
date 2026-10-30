"use client";

import { useI18n } from "@hacado/i18n/client";
import { communicationChannels } from "@hacado/types/communication";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import { HeaderActionButtonsPortal } from "@hacado/ui-admin-kit/page";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { Link } from "@hacado/ui/link";
import { Plus } from "lucide-react";
import React from "react";
import { appointmentNotificationTypes } from "../models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "../translations/types";
import { DeleteSelectedAppointmentNotificationsButton } from "./delete-selected";
import { useAppointmentNotificationsTableFilters } from "./use-table-filters";

export const AppointmentNotificationsTableAction: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);
  const tUi = useI18n("ui");
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
  } = useAppointmentNotificationsTableFilters();
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
        options={appointmentNotificationTypes.map((value) => ({
          value,
          label: t(`triggers.${value}`),
        }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
    </>
  );

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
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
      <div className="flex flex-wrap items-center gap-2 max-md:justify-between">
        <DeleteSelectedAppointmentNotificationsButton
          selected={rowSelection}
          appId={appId}
        />
        <HeaderActionButtonsPortal>
          <Link
            button
            variant="primary"
            href="/dashboard/communications/appointment-notifications/new"
            aria-label={t("table.actions.add")}
          >
            <Plus size={16} />{" "}
            <span className="max-md:hidden">{t("table.actions.add")}</span>
          </Link>
        </HeaderActionButtonsPortal>
      </div>
    </div>
  );
};
