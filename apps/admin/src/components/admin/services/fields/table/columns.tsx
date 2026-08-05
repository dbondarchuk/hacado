"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { IdName, ServiceField } from "@hacado/types";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Link,
  ScrollArea,
} from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
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
        href={`/dashboard/services/fields/${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "services.fields.table.columns.name",
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
      "services.fields.table.columns.type",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (field) => field.data.label,
    id: "label",
    header: tableSortHeader(
      "services.fields.table.columns.label",
      "string",
      "admin",
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
    header: tableSortHeader(
      "services.fields.table.columns.updatedAt",
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
              {t("services.fields.table.columns.addonsInDialog", {
                label: row.original.data.label,
              })}
            </DialogTitle>
            <ScrollArea className="max-h-64">
              <ul>
                {row.original.addons.map((addon) => (
                  <li key={addon._id}>
                    <Link
                      href={`/dashboard/services/addons/${addon._id}`}
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
      "services.fields.table.columns.addons",
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
              {t("services.fields.table.columns.optionsInDialog", {
                label: row.original.data.label,
              })}
            </DialogTitle>
            <ScrollArea className="max-h-64">
              <ul>
                {row.original.options.map((option) => (
                  <li key={option._id}>
                    <Link
                      href={`/dashboard/services/options/${option._id}`}
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
      "services.fields.table.columns.options",
      "number",
      "admin",
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction field={row.original} />,
  },
];
