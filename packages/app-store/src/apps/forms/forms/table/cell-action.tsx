"use client";
import { useI18n } from "@timelish/i18n/client";
import {
  AlertModal,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toastPromise,
} from "@timelish/ui";
import { useReload } from "@timelish/ui-admin";
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteForm, setFormArchived } from "../../actions";
import { FormListModel } from "../../models";
import {
  FormsAdminKeys,
  formsAdminNamespace,
  FormsAdminNamespace,
} from "../../translations/types";

interface CellActionProps {
  form: FormListModel;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({ form, appId }) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tUi = useI18n("ui");
  const { reload } = useReload();

  const canDelete = (form.responsesCount ?? 0) === 0;
  const isArchived = form.isArchived ?? false;

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(deleteForm(appId, form._id), {
        success: t("forms.table.toast.delete", { name: form.name }),
        error: t("forms.table.toast.deleteError"),
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

  const onConfirmArchive = async () => {
    try {
      setLoading(true);
      await toastPromise(setFormArchived(appId, form._id, true), {
        success: t("forms.table.toast.formArchived", { name: form.name }),
        error: t("forms.table.toast.archiveError"),
      });
      setArchiveOpen(false);
      reload();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUnarchive = async () => {
    try {
      setLoading(true);
      await toastPromise(setFormArchived(appId, form._id, false), {
        success: t("forms.table.toast.formUnarchived", { name: form.name }),
        error: t("forms.table.toast.unarchiveError"),
      });
      setUnarchiveOpen(false);
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
        title={t("forms.table.delete.title")}
        description={t("forms.table.delete.description", { name: form.name })}
        continueButton={t("forms.table.delete.confirm")}
      />
      <AlertModal
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={onConfirmArchive}
        loading={loading}
        title={t("forms.table.archive.title")}
        description={t("forms.table.archive.description", { name: form.name })}
        continueButton={t("forms.table.archive.confirm")}
      />
      <AlertModal
        isOpen={unarchiveOpen}
        onClose={() => setUnarchiveOpen(false)}
        onConfirm={onConfirmUnarchive}
        loading={loading}
        title={t("forms.table.unarchive.title")}
        description={t("forms.table.unarchive.description", {
          name: form.name,
        })}
        continueButton={t("forms.table.unarchive.confirm")}
      />
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
              href={`/dashboard/forms/edit?id=${form._id}`}
              className="text-foreground"
            >
              <Pencil className="size-3.5" /> {t("forms.table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/forms/new?from=${form._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" /> {t("forms.table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isArchived ? (
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              <Archive className="size-3.5" />{" "}
              {t("forms.table.actions.archive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setUnarchiveOpen(true)}>
              <ArchiveRestore className="size-3.5" />{" "}
              {t("forms.table.actions.unarchive")}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" />{" "}
                {t("forms.table.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
