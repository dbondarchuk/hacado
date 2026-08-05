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
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDesign, setDesignArchived } from "../../actions";
import { DesignListModel } from "../../models";
import { ManualPurchaseDialog } from "../../purchases/components/manual-purchase-form";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

interface CellActionProps {
  design: DesignListModel;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({ design, appId }) => {
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tUi = useI18n("ui");
  const router = useRouter();
  const { reload } = useReload();
  const canDelete = (design.purchasesCount ?? 0) === 0;
  const isArchived = design.isArchived ?? false;

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(deleteDesign(appId, design._id), {
        success: t("designs.table.toast.delete", { name: design.name }),
        error: t("designs.table.toast.deleteError"),
      });
      setDeleteOpen(false);
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmArchive = async () => {
    try {
      setLoading(true);
      await toastPromise(setDesignArchived(appId, design._id, true), {
        success: t("designs.table.toast.archived", { name: design.name }),
        error: t("designs.table.toast.archiveError"),
      });
      setArchiveOpen(false);
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUnarchive = async () => {
    try {
      setLoading(true);
      await toastPromise(setDesignArchived(appId, design._id, false), {
        success: t("designs.table.toast.unarchived", { name: design.name }),
        error: t("designs.table.toast.unarchiveError"),
      });
      setUnarchiveOpen(false);
      reload();
    } catch (e) {
      console.error(e);
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
        title={t("designs.table.delete.title")}
        description={t("designs.table.delete.description", {
          name: design.name,
        })}
        continueButton={t("designs.table.delete.confirm")}
      />
      <AlertModal
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={onConfirmArchive}
        loading={loading}
        title={t("designs.table.archive.title")}
        description={t("designs.table.archive.description", {
          name: design.name,
        })}
        continueButton={t("designs.table.archive.confirm")}
      />
      <AlertModal
        isOpen={unarchiveOpen}
        onClose={() => setUnarchiveOpen(false)}
        onConfirm={onConfirmUnarchive}
        loading={loading}
        title={t("designs.table.unarchive.title")}
        description={t("designs.table.unarchive.description", {
          name: design.name,
        })}
        continueButton={t("designs.table.unarchive.confirm")}
      />
      <ManualPurchaseDialog
        appId={appId}
        open={purchaseOpen}
        designId={design._id}
        onOpenChange={setPurchaseOpen}
        onSuccess={() => {
          router.push(
            `/dashboard/gift-card-studio/purchases?designId=${design._id}`,
          );
        }}
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
              href={`/dashboard/gift-card-studio/edit?id=${design._id}`}
              className="text-foreground"
            >
              <Pencil className="size-3.5" /> {t("designs.table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/gift-card-studio/new?from=${design._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" /> {t("designs.table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPurchaseOpen(true)}>
            <ShoppingCart className="size-3.5" />{" "}
            {t("designs.table.actions.purchase")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isArchived ? (
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              <Archive className="size-3.5" />{" "}
              {t("designs.table.actions.archive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setUnarchiveOpen(true)}>
              <ArchiveRestore className="size-3.5" />{" "}
              {t("designs.table.actions.unarchive")}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" />{" "}
                {t("designs.table.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
