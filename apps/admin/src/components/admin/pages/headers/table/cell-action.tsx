"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PageHeaderListModel } from "@hacado/types";
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
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Link from "next/link";

interface CellActionProps {
  pageHeader: PageHeaderListModel;
}

export const CellAction: React.FC<CellActionProps> = ({ pageHeader }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(
        adminApi.pageHeaders.deletePageHeader(pageHeader._id),
        {
          success: t("pages.headers.toasts.pageHeaderDeleted", {
            name: pageHeader.name,
          }),
          error: t("pages.headers.table.delete.error"),
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
              {t("pages.headers.table.actions.openMenu")}
            </span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("pages.headers.table.actions.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/headers/${pageHeader._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" />{" "}
              {t("pages.headers.table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/headers/new?from=${pageHeader._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" />{" "}
              {t("pages.headers.table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          {pageHeader.usedCount === 0 && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="size-3.5" />{" "}
                {t("pages.headers.table.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
