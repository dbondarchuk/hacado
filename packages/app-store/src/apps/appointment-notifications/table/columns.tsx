"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { Checkbox, Link } from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import { DateTime } from "luxon";
import { AppointmentNotification } from "../models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "../translations/types";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<AppointmentNotification>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("ui");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("ui");
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/communications/appointment-notifications/edit?id=${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader<
      AppointmentNotificationsAdminNamespace,
      AppointmentNotificationsAdminKeys
    >("table.columns.name", "string", appointmentNotificationsAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<
        AppointmentNotificationsAdminNamespace,
        AppointmentNotificationsAdminKeys
      >(appointmentNotificationsAdminNamespace);
      return t(`triggers.${row.original.type}`);
    },
    id: "type",
    header: tableSortHeader<
      AppointmentNotificationsAdminNamespace,
      AppointmentNotificationsAdminKeys
    >("table.columns.type", "string", appointmentNotificationsAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<
        AppointmentNotificationsAdminNamespace,
        AppointmentNotificationsAdminKeys
      >(appointmentNotificationsAdminNamespace);
      return t(`channels.${row.original.channel}`);
    },
    id: "channel",
    header: tableSortHeader<
      AppointmentNotificationsAdminNamespace,
      AppointmentNotificationsAdminKeys
    >(
      "table.columns.channel",
      "string",
      appointmentNotificationsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.updatedAt).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "updatedAt",
    header: tableSortHeader<
      AppointmentNotificationsAdminNamespace,
      AppointmentNotificationsAdminKeys
    >(
      "table.columns.updatedAt",
      "date",
      appointmentNotificationsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction
        appointmentNotification={row.original}
        appId={row.original.appId}
      />
    ),
  },
];
