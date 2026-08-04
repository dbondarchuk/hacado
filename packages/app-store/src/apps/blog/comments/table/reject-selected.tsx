"use client";

import { useI18n } from "@timelish/i18n/client";
import { Button, Spinner, toastPromise } from "@timelish/ui";
import { useReload } from "@timelish/ui-admin";
import { X } from "lucide-react";
import React from "react";
import { rejectSelectedBlogComments } from "../../actions";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { CommentsTableRow } from "./columns";

export const RejectSelectedBlogCommentsButton: React.FC<{
  appId: string;
  selected: CommentsTableRow[];
  disabled?: boolean;
}> = ({ selected, appId, disabled }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tAdmin = useI18n("admin");
  const { reload } = useReload();

  const ids = selected
    .filter((row) => row.status !== "rejected")
    .map((row) => row._id);

  const action = async () => {
    if (ids.length === 0) {
      return;
    }
    try {
      setIsLoading(true);
      await toastPromise(rejectSelectedBlogComments(appId, ids), {
        success: t("comments.table.toast.commentsRejected", {
          count: ids.length,
        }),
        error: tAdmin("common.toasts.error"),
      });
      reload();
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      disabled={isLoading || disabled || ids.length === 0}
      onClick={action}
    >
      {isLoading && <Spinner />}
      <X className="h-4 w-4" />
      <span className="max-md:hidden">
        {t("comments.table.rejectSelected.label", { count: ids.length })}
      </span>
    </Button>
  );
};
