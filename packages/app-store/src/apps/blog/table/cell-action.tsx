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
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteBlogPost } from "../actions";
import { BlogPost } from "../models";
import {
  BlogAdminKeys,
  blogAdminNamespace,
  BlogAdminNamespace,
} from "../translations/types";

interface CellActionProps {
  blogPost: BlogPost;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({ blogPost, appId }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const tUi = useI18n("ui");

  const { reload } = useReload();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(deleteBlogPost(appId, blogPost._id), {
        success: t("table.toast.blog_post_deleted", {
          title: blogPost.title,
        }),
        error: t("table.toast.error_deleting_blog_post"),
      });

      setOpen(false);
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
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title={t("table.delete.title")}
        description={t("table.delete.description")}
        continueButton={t("table.delete.confirm")}
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
              href={`/dashboard/blog/edit?id=${blogPost._id}`}
              className="text-foreground"
            >
              <Pencil className="size-3.5" /> {t("table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/blog/new?from=${blogPost._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" /> {t("table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash2 className="size-3.5" /> {t("table.delete.action")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
