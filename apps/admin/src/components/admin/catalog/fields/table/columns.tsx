"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { ServiceField } from "@hacado/types/booking";
import { IdName } from "@hacado/types/services";
import {
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Button } from "@hacado/ui/button";
import { Checkbox } from "@hacado/ui/checkbox";
import { useTimeZone } from "@hacado/ui/context";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@hacado/ui/dialog";
import { Link } from "@hacado/ui/link";
import { ScrollArea } from "@hacado/ui/scroll-area";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<
  ServiceField & {
    addons?: IdName[];
    options?: IdName[];
  }
>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
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
        href={`/dashboard/catalog/fields/${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "catalog.fields.table.columns.name",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.fieldType.${row.original.type}`);
    },
    id: "type",
    header: tableSortHeader(
      "catalog.fields.table.columns.type",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (field) => field.data.label,
    id: "label",
    header: tableSortHeader(
      "catalog.fields.table.columns.label",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      const timeZone = useTimeZone();
      return DateTime.fromJSDate(row.original.updatedAt)
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED, { locale });
    },
    id: "updatedAt",
    header: tableSortHeader(
      "catalog.fields.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return row.original.addons?.length ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link-dashed">{row.original.addons.length}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>
              {t("catalog.fields.table.columns.addonsInDialog", {
                label: row.original.data.label,
              })}
            </DialogTitle>
            <ScrollArea className="max-h-64">
              <ul>
                {row.original.addons.map((addon) => (
                  <li key={addon._id}>
                    <Link
                      href={`/dashboard/catalog/addons/${addon._id}`}
                      variant="underline"
                    >
                      {addon.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("common.buttons.close")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Button variant="link" disabled>
          0
        </Button>
      );
    },
    id: "addons",
    header: tableSortHeader(
      "catalog.fields.table.columns.addons",
      "number",
      "admin",
    ),
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return row.original.options?.length ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link-dashed">{row.original.options.length}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>
              {t("catalog.fields.table.columns.optionsInDialog", {
                label: row.original.data.label,
              })}
            </DialogTitle>
            <ScrollArea className="max-h-64">
              <ul>
                {row.original.options.map((option) => (
                  <li key={option._id}>
                    <Link
                      href={`/dashboard/catalog/services/${option._id}`}
                      variant="underline"
                    >
                      {option.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t("common.buttons.close")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Button variant="link" disabled>
          0
        </Button>
      );
    },
    id: "options",
    header: tableSortHeader(
      "catalog.fields.table.columns.options",
      "number",
      "admin",
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction field={row.original} />,
  },
];
