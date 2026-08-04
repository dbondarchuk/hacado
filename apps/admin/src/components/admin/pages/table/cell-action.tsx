"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Page } from "@timelish/types";
import {
  AlertModal,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
  toastPromise,
  useWebsiteUrl,
} from "@timelish/ui";
import copy from "copy-text-to-clipboard";
import {
  Copy,
  CopyCheck,
  CopySlash,
  Edit,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CellActionProps {
  page: Page;
}

export const CellAction: React.FC<CellActionProps> = ({ page: page }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const websiteUrl = useWebsiteUrl();

  const copyRelative = () => {
    const url = `/${page.slug}`;
    copy(url);

    toast.info(t("assets.toasts.copied"), {
      description: t("pages.toasts.relativeUrlCopied", { url }),
      icon: <Copy />,
    });
  };

  const copyAbsolute = () => {
    const url = `${websiteUrl}/${page.slug}`;
    copy(url);

    toast.info(t("assets.toasts.copied"), {
      description: t("pages.toasts.absoluteUrlCopied", { url }),
      icon: <Copy />,
    });
  };

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(adminApi.pages.deletePage(page._id), {
        success: t("pages.toasts.pageDeleted", { title: page.title }),
        error: t("pages.table.delete.error"),
      });

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
            <span className="sr-only">{t("pages.table.actions.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("pages.table.actions.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/${page._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" /> {t("pages.table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/pages/new?from=${page._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" /> {t("pages.table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          {page.slug !== "home" && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="size-3.5" /> {t("pages.table.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyRelative}>
            <CopySlash className="size-3.5" />{" "}
            {t("pages.table.actions.copyRelativeUrl")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyAbsolute}>
            <CopyCheck className="size-3.5" />{" "}
            {t("pages.table.actions.copyAbsoluteUrl")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
