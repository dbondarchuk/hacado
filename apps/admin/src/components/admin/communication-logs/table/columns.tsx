"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { CommunicationLog } from "@hacado/types/communication";
import { CommunicationLogPayloadDialog } from "@hacado/ui-admin-kit";
import {
  CustomerName,
  MemberName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Badge } from "@hacado/ui/badge";
import { Button } from "@hacado/ui/button";
import { Checkbox } from "@hacado/ui/checkbox";
import { useTimeZone } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
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
    id: "status",
    header: tableSortHeader(
      "communicationLogs.table.columns.status",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const t = useI18n("admin");
      const { status, retriesDone, retriesLeft } = row.original;
      const done = retriesDone ?? 0;
      const left = retriesLeft ?? 0;
      const label =
        status === "failed"
          ? left > 0
            ? t("communications.status.failedWithRetries", {
                done,
                max: done + left,
              })
            : t("communications.status.failedFinal")
          : t(`communications.status.${status}`);

      return (
        <Badge variant={status === "failed" ? "destructive" : "outline"}>
          {label}
        </Badge>
      );
    },
  },
  {
    id: "reason",
    enableSorting: false,
    header: () => {
      const t = useI18n("admin");
      return t("communicationLogs.table.columns.reason");
    },
    cell: ({ row }) => {
      const t = useI18n();
      const { status, reason } = row.original;
      if (status !== "failed" || !reason) return null;

      const text =
        typeof reason === "string"
          ? t.has(reason as any)
            ? t(reason as any)
            : reason
          : t.has(reason.key)
            ? t(reason.key, reason.args)
            : reason.key;

      return <span className="line-clamp-2 max-w-64">{text}</span>;
    },
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
      const timeZone = useTimeZone();
      return DateTime.fromJSDate(row.original.dateTime)
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED, { locale });
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
    id: "appointment.service.name",
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
          {row.original.appointment?.service.name}
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
