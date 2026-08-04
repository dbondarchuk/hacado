"use client";

import { useI18n } from "@timelish/i18n/client";
import { AlertModal, Button, Spinner, toastPromise } from "@timelish/ui";
import { useReload } from "@timelish/ui-admin";
import { Archive } from "lucide-react";
import React from "react";
import { setFormsArchived } from "../../actions";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormsTableRow } from "./columns";

export const ArchiveSelectedFormsButton: React.FC<{
  appId: string;
  selected: FormsTableRow[];
  disabled?: boolean;
}> = ({ selected, appId, disabled }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");

  const { reload } = useReload();
  const action = async () => {
    try {
      setIsLoading(true);
      await toastPromise(
        setFormsArchived(
          appId,
          selected.map((r) => r._id),
          true,
        ),
        {
          success: t("forms.table.toast.formsArchived", {
            count: selected.length,
          }),
          error: tAdmin("common.toasts.error"),
        },
      );
      reload();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        disabled={disabled || isLoading || !selected?.length}
        onClick={() => setIsOpen(true)}
        aria-label={t("forms.table.archiveSelected.label", {
          count: selected.length,
        })}
      >
        {isLoading && <Spinner />}
        <Archive className="h-4 w-4" />
        <span className="max-md:hidden">
          {t("forms.table.archiveSelected.label", { count: selected.length })}
        </span>
      </Button>
      <AlertModal
        isOpen={isOpen}
        loading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={action}
        description={t("forms.table.archiveSelected.description", {
          count: selected.length,
        })}
        continueButton={t("forms.table.archiveSelected.confirm", {
          count: selected.length,
        })}
      />
    </>
  );
};
