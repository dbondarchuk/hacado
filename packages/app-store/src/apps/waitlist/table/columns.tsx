"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Link,
} from "@hacado/ui";
import {
  CustomerName,
  MemberName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin";
import { ColumnDef } from "@tanstack/react-table";
import { CalendarPlus } from "lucide-react";
import { DateTime } from "luxon";
import { WaitlistEntry } from "../models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";
import { WaitlistDate } from "../views/components/waitlist-date";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<WaitlistEntry & { appId: string }>[] = [
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
        href={`/dashboard/services/options/${row.original.optionId}`}
        variant="underline"
      >
        {row.original.option?.name}
      </Link>
    ),
    id: "option.name",
    header: tableSortHeader<WaitlistAdminNamespace, WaitlistAdminKeys>(
      "table.columns.option",
      "string",
      waitlistAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.customerId}`}
        variant="underline"
      >
        <CustomerName
          customer={row.original.customer ?? { name: row.original.name }}
        />
      </Link>
    ),
    id: "customer.name",
    header: tableSortHeader<WaitlistAdminNamespace, WaitlistAdminKeys>(
      "table.columns.customer",
      "string",
      waitlistAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <MemberName member={row.original.member} />,
    id: "member.name",
    header: tableSortHeader<WaitlistAdminNamespace, WaitlistAdminKeys>(
      "table.columns.member",
      "string",
      waitlistAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );
      return t(`statuses.${row.original.status}`);
    },
    id: "status",
    header: tableSortHeader<WaitlistAdminNamespace, WaitlistAdminKeys>(
      "table.columns.status",
      "string",
      waitlistAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "createdAt",
    header: tableSortHeader<WaitlistAdminNamespace, WaitlistAdminKeys>(
      "table.columns.createdAt",
      "date",
      waitlistAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );

      if (row.original.asSoonAsPossible) {
        return t("view.asSoonAsPossible");
      }

      return <WaitlistDate entry={row.original} />;
    },
    id: "dateAndTime",
    header: () => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );
      return t("table.columns.dateAndTime");
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    header: () => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );
      return t("table.columns.note");
    },
    cell: ({ row }) => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );

      if (!row.original.note) return null;
      if (row.original.note.length <= 50)
        return <div className="whitespace-pre-wrap">{row.original.note}</div>;

      return (
        <div className="flex flex-col gap-1">
          <div className="whitespace-pre-wrap">
            {row.original.note.substring(0, 50)}...
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link-dashed">
                {t("table.actions.viewNote")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80%] flex flex-col max-h-[100%]">
              <DialogHeader>
                <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
                  {t("table.columns.note")}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 w-full overflow-auto whitespace-pre-wrap">
                {row.original.note}
              </div>
              <DialogFooter className="flex-row !justify-between gap-2">
                <DialogClose asChild>
                  <Button variant="secondary">
                    {t("table.actions.close")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
    id: "note",
  },
  {
    cell: ({ row }) => {
      const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
        "app_waitlist_admin",
      );
      return (
        <Link
          href={`/dashboard/waitlist/appointment/new?id=${row.original._id}`}
          variant="primary"
          button
        >
          <CalendarPlus /> {t("table.actions.createAppointment")}
        </Link>
      );
    },
    id: "createAppointment",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction waitlistEntry={row.original} appId={row.original.appId} />
    ),
  },
];
