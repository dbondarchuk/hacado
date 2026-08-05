"use client";

import { useI18n } from "@hacado/i18n/client";
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
} from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { Check, MoreHorizontal, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  approveBlogComment,
  deleteBlogComment,
  rejectBlogComment,
} from "../../actions";
import { BlogCommentListItem } from "../../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";

export const CellAction: React.FC<{
  comment: BlogCommentListItem;
  appId: string;
}> = ({ comment, appId }) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tUi = useI18n("ui");
  const { reload } = useReload();

  const onApprove = async () => {
    try {
      setLoading(true);
      await toastPromise(approveBlogComment(appId, comment._id), {
        success: (data) =>
          t("comments.table.toast.approved", { authorName: data.authorName }),
        error: t("comments.table.toast.error"),
      });
      reload();
    } finally {
      setLoading(false);
    }
  };

  const onReject = async () => {
    try {
      setLoading(true);
      await toastPromise(rejectBlogComment(appId, comment._id), {
        success: (data) =>
          t("comments.table.toast.rejected", { authorName: data.authorName }),
        error: t("comments.table.toast.error"),
      });
      reload();
    } finally {
      setLoading(false);
    }
  };

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(deleteBlogComment(appId, comment._id), {
        success: (data) =>
          t("comments.table.toast.deleted", { authorName: data.authorName }),
        error: t("comments.table.toast.error"),
      });
      setDeleteOpen(false);
      reload();
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
        title={t("comments.table.delete.title")}
        description={t("comments.table.delete.description")}
        continueButton={t("comments.table.delete.confirm")}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            <span className="sr-only">{tUi("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{tUi("actions.label")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {comment.status !== "approved" && (
            <DropdownMenuItem onClick={onApprove}>
              <Check className="size-3.5" />
              {t("comments.table.actions.approve")}
            </DropdownMenuItem>
          )}
          {comment.status !== "rejected" && (
            <DropdownMenuItem onClick={onReject}>
              <X className="size-3.5" />
              {t("comments.table.actions.reject")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" />
            {t("comments.table.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
