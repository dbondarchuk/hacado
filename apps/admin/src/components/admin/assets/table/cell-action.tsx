"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Asset } from "@hacado/types";
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
  Download,
  Edit,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CellActionProps {
  asset: Asset;
}

export const CellAction: React.FC<CellActionProps> = ({ asset }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const websiteUrl = useWebsiteUrl();
  const { copyToClipboard } = useClipboard();

  const copyRelative = () => {
    const url = `/assets/${asset.filename}`;
    copyToClipboard(url);

    toast.info(t("assets.toasts.copied"), {
      icon: <Copy />,
      description: t("assets.toasts.relativeUrlCopied", { url }),
    });
  };

  const copyAbsolute = () => {
    const url = `${websiteUrl}/assets/${asset.filename}`;
    copyToClipboard(url);

    toast.info(t("assets.toasts.copied"), {
      description: t("assets.toasts.absoluteUrlCopied", { url }),
      icon: <Copy />,
    });
  };

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(adminApi.assets.deleteAsset(asset._id), {
        success: t("assets.toasts.assetDeleted", { filename: asset.filename }),
        error: t("common.toasts.error"),
      });

      router.refresh();

      setOpen(false);
    } catch (error: any) {
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
              {t("assets.table.actions.openMenu")}
            </span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("assets.table.actions.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/assets/${asset._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" /> {t("assets.table.actions.update")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="size-3.5" /> {t("assets.table.actions.delete")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyRelative()}>
            <CopySlash className="size-3.5" />{" "}
            {t("assets.table.actions.copyRelativeUrl")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyAbsolute()}>
            <CopyCheck className="size-3.5" />{" "}
            {t("assets.table.actions.copyAbsoluteUrl")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/assets/${asset.filename}`}
              target="_blank"
              className="text-foreground"
            >
              <Download className="size-3.5" />{" "}
              {t("assets.table.actions.download")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
