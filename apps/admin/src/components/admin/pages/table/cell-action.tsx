"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Page } from "@hacado/types";
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
  useClipboard,
  useWebsiteUrl,
} from "@hacado/ui";
import {
  Copy,
  CopyCheck,
  CopySlash,
  Edit,
  Link2,
  MoreHorizontal,
  QrCode,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLinkShorteningEnabled } from "./link-shortening-enabled-context";
import { PageQrCodeDialog } from "./page-qr-code-dialog";
import { getShortPageUrl } from "./short-url-actions";

interface CellActionProps {
  page: Page;
}

export const CellAction: React.FC<CellActionProps> = ({ page }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const router = useRouter();
  const websiteUrl = useWebsiteUrl();
  const linkShorteningEnabled = useLinkShorteningEnabled();
  const { copyToClipboard } = useClipboard();

  const copyRelative = () => {
    const url = `/${page.slug}`;
    copyToClipboard(url);

    toast.info(t("assets.toasts.copied"), {
      description: t("pages.toasts.relativeUrlCopied", { url }),
      icon: <Copy />,
    });
  };

  const copyAbsolute = () => {
    const url = `${websiteUrl}/${page.slug}`;
    copyToClipboard(url);

    toast.info(t("assets.toasts.copied"), {
      description: t("pages.toasts.absoluteUrlCopied", { url }),
      icon: <Copy />,
    });
  };

  const copyShort = async () => {
    try {
      setLoading(true);
      const result = await getShortPageUrl(page.slug);
      if (!result.ok) {
        toast.error(t("pages.toasts.shortUrlCopyError"));
        return;
      }

      copyToClipboard(result.url);
      toast.info(t("assets.toasts.copied"), {
        description: t("pages.toasts.shortUrlCopied", { url: result.url }),
        icon: <Copy />,
      });
    } finally {
      setLoading(false);
    }
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
      <PageQrCodeDialog
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        pageSlug={page.slug}
        websiteUrl={websiteUrl}
        linkShorteningEnabled={linkShorteningEnabled}
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
          <DropdownMenuItem onClick={() => copyRelative()}>
            <CopySlash className="size-3.5" />{" "}
            {t("pages.table.actions.copyRelativeUrl")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyAbsolute()}>
            <CopyCheck className="size-3.5" />{" "}
            {t("pages.table.actions.copyAbsoluteUrl")}
          </DropdownMenuItem>
          {linkShorteningEnabled && (
            <DropdownMenuItem onClick={() => copyShort()} disabled={loading}>
              <Link2 className="size-3.5" />{" "}
              {t("pages.table.actions.copyShortUrl")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setQrOpen(true)}>
            <QrCode className="size-3.5" />{" "}
            {t("pages.table.actions.generateQrCode")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
