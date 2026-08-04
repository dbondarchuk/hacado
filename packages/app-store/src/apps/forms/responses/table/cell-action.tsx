"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  AlertModal,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  toastPromise,
} from "@timelish/ui";
import { CustomerSelector, useReload } from "@timelish/ui-admin";
import { MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteFormResponse, reassignFormResponses } from "../../actions";
import {
  FormsAdminKeys,
  formsAdminNamespace,
  FormsAdminNamespace,
} from "../../translations/types";
import type { ResponseTableRow } from "./columns";

interface CellActionProps {
  response: ResponseTableRow;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({ response, appId }) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignCustomerId, setReassignCustomerId] = useState<
    string | undefined
  >(response.customerId ?? undefined);
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tUi = useI18n("ui");
  const { reload } = useReload();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(deleteFormResponse(appId, response._id), {
        success: t("responses.table.toast.delete"),
        error: t("responses.table.toast.deleteError"),
      });
      setDeleteOpen(false);
      reload();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmReassign = async () => {
    try {
      setLoading(true);
      const answersRecord = Object.fromEntries(
        response.answers.map((a) => [a.name, a.value]),
      );
      await toastPromise(
        reassignFormResponses(
          appId,
          [response._id],
          reassignCustomerId ?? null,
        ),
        {
          success: t("responses.table.toast.reassigned"),
          error: t("responses.table.toast.reassignError"),
        },
      );
      setReassignOpen(false);
      reload();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title={t("responses.table.delete.title")}
        description={t("responses.table.delete.description")}
        continueButton={t("responses.table.delete.confirm")}
      />
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("responses.table.reassign.title")}</DialogTitle>
            <DialogDescription>
              {t("responses.table.reassign.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            <Label>{t("responses.edit.customerLabel")}</Label>
            <CustomerSelector
              onItemSelect={(id) => setReassignCustomerId(id ?? undefined)}
              value={reassignCustomerId}
              allowClear
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("responses.table.reassign.cancel")}
              </Button>
            </DialogClose>
            <Button onClick={onConfirmReassign} disabled={loading}>
              {t("responses.table.reassign.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{tUi("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{tUi("actions.label")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/forms/responses/edit?id=${response._id}`}
              className="text-foreground"
            >
              <Pencil className="size-3.5" />{" "}
              {t("responses.table.actions.viewEdit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReassignCustomerId(response.customerId ?? undefined);
              setReassignOpen(true);
            }}
          >
            <UserPlus className="size-3.5" />{" "}
            {t("responses.table.actions.reassignCustomer")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" />{" "}
            {t("responses.table.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
