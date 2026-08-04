"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { CommunicationLog } from "@timelish/types";
import { Button, Checkbox, Link } from "@timelish/ui";
import {
  CustomerName,
  MemberName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@timelish/ui-admin";
import { CommunicationLogPayloadDialog } from "@timelish/ui-admin-kit";
import { DateTime } from "luxon";

export const columns: ColumnDef<CommunicationLog>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("communicationLogs.table.actions.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("communicationLogs.table.actions.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.direction.${row.original.direction}`);
    },
    id: "direction",
    header: tableSortHeader(
      "communicationLogs.table.columns.direction",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.channel.${row.original.channel}`);
    },
    id: "channel",
    header: tableSortHeader(
      "communicationLogs.table.columns.channel",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.participantType.${row.original.participantType}`);
    },
    id: "participantType",
    header: tableSortHeader(
      "communicationLogs.table.columns.participantType",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (log) => log.participant,
    id: "participant",
    header: tableSortHeader(
      "communicationLogs.table.columns.participant",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n();
      return t(
        typeof row.original.handledBy === "string"
          ? row.original.handledBy
          : typeof row.original.handledBy === "object" &&
              row.original.handledBy.key
            ? row.original.handledBy.key
            : "admin.common.labels.unknown",
        typeof row.original.handledBy === "object" &&
          row.original.handledBy.args
          ? row.original.handledBy.args
          : undefined,
      );
    },
    id: "handledBy",
    header: tableSortHeader(
      "communicationLogs.table.columns.handler",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (log) => log.subject,
    id: "subject",
    header: tableSortHeader(
      "communicationLogs.table.columns.subject",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "content",
    header: tableSortHeader(
      "communicationLogs.table.columns.content",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const t = useI18n("admin");
      const { preview, _id, channel } = row.original;
      if (preview.length < 50) return preview;

      return (
        <div className="flex flex-col gap-1">
          <span>{preview.substring(0, 50)}...</span>
          <CommunicationLogPayloadDialog
            logId={_id}
            channel={channel}
            mode="body"
            title={t("communicationLogs.table.actions.logContent")}
            trigger={
              <Button variant="link-dashed">
                {t("communicationLogs.table.actions.viewMore")}
              </Button>
            }
          />
        </div>
      );
    },
  },
  {
    id: "data",
    header: () => {
      const t = useI18n("admin");
      return t("communicationLogs.table.columns.data");
    },
    enableSorting: false,
    cell: ({ row }) => {
      const t = useI18n("admin");
      if (!row.original.hasPayloadData) return null;
      return (
        <div className="flex flex-col gap-1">
          <CommunicationLogPayloadDialog
            logId={row.original._id}
            channel={row.original.channel}
            mode="data"
            title={t("communicationLogs.table.actions.logData")}
            trigger={
              <Button variant="link-dashed">
                {t("communicationLogs.table.actions.view")}
              </Button>
            }
          />
        </div>
      );
    },
    accessorFn: () => "", // Data column doesn't need sorting
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.dateTime).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "dateTime",
    header: tableSortHeader(
      "communicationLogs.table.columns.dateTime",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "appointment.option.name",
    sortingFn: tableSortNoopFunction,
    header: tableSortHeader(
      "communicationLogs.table.columns.appointment",
      "string",
      "admin",
    ),
    cell: ({ row }) => {
      if (!row.original.appointmentId) return null;

      return (
        <Link
          variant="default"
          href={`/dashboard/appointments/${row.original.appointmentId}`}
        >
          {row.original.appointment?.option.name}
        </Link>
      );
    },
  },
  {
    id: "customer.name",
    sortingFn: tableSortNoopFunction,
    header: tableSortHeader(
      "communicationLogs.table.columns.customer",
      "string",
      "admin",
    ),
    cell: ({ row }) => {
      if (!row.original.customer) return null;

      return (
        <Link
          variant="default"
          href={`/dashboard/customers/${row.original.customer._id}`}
        >
          <CustomerName customer={row.original.customer} />
        </Link>
      );
    },
  },
  {
    id: "member.name",
    sortingFn: tableSortNoopFunction,
    header: tableSortHeader(
      "communicationLogs.table.columns.member",
      "string",
      "admin",
    ),
    cell: ({ row }) => <MemberName member={row.original.member} />,
  },
];
