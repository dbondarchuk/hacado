"use client";

import { useI18n } from "@hacado/i18n/client";
import { AlertModal, Button, Spinner, toastPromise } from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { Archive } from "lucide-react";
import React from "react";
import { setDesignsArchived } from "../../actions";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { DesignsTableRow } from "./columns";

export const ArchiveSelectedDesignsButton: React.FC<{
  appId: string;
  selected: DesignsTableRow[];
  disabled?: boolean;
}> = ({ selected, appId, disabled }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tAdmin = useI18n("admin");

  const { reload } = useReload();
  const action = async () => {
    try {
      setIsLoading(true);
      await toastPromise(
        setDesignsArchived(
          appId,
          selected.map((r) => r._id),
          true,
        ),
        {
          success: t("designs.table.toast.designsArchived", {
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
        aria-label={t("designs.table.archiveSelected.label", {
          count: selected.length,
        })}
        onClick={() => setIsOpen(true)}
      >
        {isLoading && <Spinner />}
        <Archive className="h-4 w-4" />
        <span className="max-xl:hidden">
          {t("designs.table.archiveSelected.label", { count: selected.length })}
        </span>
      </Button>
      <AlertModal
        isOpen={isOpen}
        loading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={action}
        description={t("designs.table.archiveSelected.description", {
          count: selected.length,
        })}
        continueButton={t("designs.table.archiveSelected.confirm", {
          count: selected.length,
        })}
      />
    </>
  );
};
