"use client";

import { useI18n } from "@hacado/i18n/client";
import { AlertModal, Button, Spinner, toastPromise } from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { Trash } from "lucide-react";
import React from "react";
import { deleteSelectedBlogComments } from "../../actions";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { CommentsTableRow } from "./columns";

export const DeleteSelectedBlogCommentsButton: React.FC<{
  appId: string;
  selected: CommentsTableRow[];
}> = ({ selected, appId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tAdmin = useI18n("admin");
  const { reload } = useReload();

  const action = async () => {
    try {
      setIsLoading(true);
      await toastPromise(
        deleteSelectedBlogComments(
          appId,
          selected.map((r) => r._id),
        ),
        {
          success: t("comments.table.toast.commentsDeleted", {
            count: selected.length,
          }),
          error: tAdmin("common.toasts.error"),
        },
      );
      reload();
      setIsOpen(false);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        disabled={isLoading || !selected?.length}
        onClick={() => setIsOpen(true)}
      >
        {isLoading && <Spinner />}
        <Trash className="h-4 w-4" />
        <span className="max-md:hidden">
          {t("comments.table.deleteSelected.label", { count: selected.length })}
        </span>
      </Button>
      <AlertModal
        isOpen={isOpen}
        loading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={action}
        description={t("comments.table.deleteSelected.description", {
          count: selected.length,
        })}
        continueButton={t("comments.table.deleteSelected.confirm", {
          count: selected.length,
        })}
      />
    </>
  );
};
