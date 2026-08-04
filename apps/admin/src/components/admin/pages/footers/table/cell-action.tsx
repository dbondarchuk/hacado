"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { PageFooterListModel } from "@timelish/types";
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
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Link from "next/link";

interface CellActionProps {
  pageFooter: PageFooterListModel;
}

export const CellAction: React.FC<CellActionProps> = ({ pageFooter }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(
        adminApi.pageFooters.deletePageFooter(pageFooter._id),
        {
          success: t("pages.footers.toasts.pageFooterDeleted", {
            name: pageFooter.name,
          }),
          error: t("pages.footers.table.delete.error"),
        },
      );

      setOpen(false);
      router.refresh();
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
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">
              {t("pages.footers.table.actions.openMenu")}
            </span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("pages.footers.table.actions.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/footers/${pageFooter._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" />{" "}
              {t("pages.footers.table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/footers/new?from=${pageFooter._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" />{" "}
              {t("pages.footers.table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          {pageFooter.usedCount === 0 && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="size-3.5" />{" "}
                {t("pages.footers.table.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
