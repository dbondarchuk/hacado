"use client";
import { useI18n } from "@hacado/i18n/client";
import {
  TableDateTime,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Checkbox } from "@hacado/ui/checkbox";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  AppointmentReminder,
  readAppointmentReminderChannels,
} from "../models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "../translations/types";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<AppointmentReminder>[] = [
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
        href={`/dashboard/communications/appointment-reminders/edit?id=${row.original._id}`}
        variant="underline"
        size="sm"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader<
      AppointmentRemindersAdminNamespace,
      AppointmentRemindersAdminKeys
    >("table.columns.name", "string", appointmentRemindersAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<
        AppointmentRemindersAdminNamespace,
        AppointmentRemindersAdminKeys
      >(appointmentRemindersAdminNamespace);

      return t(`triggers.${row.original.type}`);
    },
    id: "type",
    header: tableSortHeader<
      AppointmentRemindersAdminNamespace,
      AppointmentRemindersAdminKeys
    >("table.columns.type", "string", appointmentRemindersAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<
        AppointmentRemindersAdminNamespace,
        AppointmentRemindersAdminKeys
      >(appointmentRemindersAdminNamespace);

      const channels = readAppointmentReminderChannels(row.original);
      const labels = [
        channels.emailEnabled ? t("channels.email") : null,
        channels.textEnabled ? t("channels.text-message") : null,
      ].filter((label): label is string => Boolean(label));

      return labels.join(", ");
    },
    id: "channel",
    header: tableSortHeader<
      AppointmentRemindersAdminNamespace,
      AppointmentRemindersAdminKeys
    >("table.columns.channel", "string", appointmentRemindersAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <TableDateTime value={row.original.updatedAt} />,
    id: "updatedAt",
    header: tableSortHeader<
      AppointmentRemindersAdminNamespace,
      AppointmentRemindersAdminKeys
    >("table.columns.updatedAt", "date", appointmentRemindersAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction
        appointmentReminder={row.original}
        appId={row.original.appId}
      />
    ),
  },
];
