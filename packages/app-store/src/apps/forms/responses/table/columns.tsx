"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useI18n } from "@timelish/i18n/client";
import { Button, Checkbox, Link } from "@timelish/ui";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@timelish/ui-admin";
import { DateTime } from "luxon";
import React from "react";
import { FormResponseListModel, FormResponseModel } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { CellAction } from "./cell-action";
import { ResponsePreviewDialog } from "./response-preview-dialog";

function answersPreview(
  answers: FormResponseModel["answers"],
  maxLen = 80,
): string {
  const parts = answers.slice(0, 3).map((a) => {
    const v = Array.isArray(a.value)
      ? a.value.join(", ")
      : a.value === null || a.value === undefined
        ? ""
        : String(a.value);
    return `${a.label}: ${v}`;
  });
  const s = parts.join(" · ");
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

const AnswersPreviewCell: React.FC<{ response: ResponsesTableRow }> = ({
  response,
}) => {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  return (
    <>
      <Button
        onClick={() => setPreviewOpen(true)}
        className="text-muted-foreground truncate max-w-[240px] block text-left focus:outline-none"
        variant="link-dashed"
        title={t("responses.table.columns.previewTitle" as FormsAdminKeys)}
      >
        {answersPreview(response.answers)}
      </Button>
      <ResponsePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        response={response}
      />
    </>
  );
};

export type ResponsesTableRow = FormResponseListModel & { appId: string };
export type ResponseTableRow = ResponsesTableRow;

export const columns: ColumnDef<ResponsesTableRow>[] = [
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
        href={`/dashboard/forms/edit?id=${row.original.formId}`}
        variant="underline"
      >
        {row.original.formName ?? row.original.formId}
      </Link>
    ),
    id: "formName",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "responses.table.columns.form",
      "string",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <AnswersPreviewCell response={row.original} />,
    id: "answersPreview",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "responses.table.columns.answersPreview",
      "string",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          href={`/dashboard/customers/${row.original.customerId}`}
          variant="underline"
        >
          <CustomerName customer={row.original.customer} />
        </Link>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    id: "customerId",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "responses.table.columns.customer",
      "string",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
      ),
    id: "createdAt",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "responses.table.columns.createdAt",
      "date",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction response={row.original} appId={row.original.appId} />
    ),
  },
];
