"use client";

import { adminApi } from "@hacado/api-sdk";
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
  MoreHorizontal,
  RefreshCcw,
  RefreshCw,
  Send,
  SendHorizonal,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  deletePurchasedGiftCard,
  regenerateGiftCardAssets,
  resendEmail,
} from "../../actions";
import { PurchasedGiftCardListModel } from "../../models/purchased-gift-card";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

interface CellActionProps {
  purchase: PurchasedGiftCardListModel;
}

export const CellAction: React.FC<CellActionProps> = ({ purchase }) => {
  const tUi = useI18n("ui");
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const [loading, setLoading] = useState(false);
  const { reload } = useReload();
  const isActive = purchase.status === "active";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resendEmailOpenType, setResendEmailOpenType] = useState<
    "customer" | "recipient" | null
  >(null);

  const onConfirmResendEmail = async (type: "customer" | "recipient") => {
    try {
      setLoading(true);
      await toastPromise(resendEmail(purchase.appId, purchase._id, type), {
        success: t(`purchases.table.resendEmail.${type}.toast.success`, {
          code: purchase.giftCardCode ?? purchase.giftCardId,
          email:
            type === "customer"
              ? purchase.customer.email
              : (purchase.toEmail ?? purchase.customer.email),
        }),
        error: tUi("common.toasts.error"),
      });
      reload();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSetStatus = async (status: "active" | "inactive") => {
    try {
      setLoading(true);
      await toastPromise(
        adminApi.giftCards.setGiftCardStatus(purchase.giftCardId, status),
        {
          success:
            status === "active"
              ? t("purchases.table.toast.setActive", {
                  code: purchase.giftCardCode ?? purchase.giftCardId,
                })
              : t("purchases.table.toast.setInactive", {
                  code: purchase.giftCardCode ?? purchase.giftCardId,
                }),
          error: tUi("common.toasts.error"),
        },
      );
      reload();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRegenerate = async (type: "gift-card" | "invoice") => {
    try {
      setLoading(true);
      await toastPromise(
        regenerateGiftCardAssets(purchase.appId, purchase._id, type),
        {
          success:
            type === "gift-card"
              ? t("purchases.table.toast.regeneratedGiftCard")
              : t("purchases.table.toast.regeneratedInvoice"),
          error: tUi("common.toasts.error"),
        },
      );
      reload();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(
        deletePurchasedGiftCard(purchase.appId, purchase._id),
        {
          success: t("purchases.table.delete.toast.success", {
            code: purchase.giftCardCode ?? purchase.giftCardId,
          }),
          error: tUi("common.toasts.error"),
        },
      );
      reload();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openResendEmail = (type: "customer" | "recipient") => {
    setResendEmailOpenType(type);
  };

  const canDelete =
    purchase.paymentsCount === 0 && purchase.paymentMethod !== "online";

  const canSendToCustomer =
    purchase.invoiceGenerationStatus === "completed" &&
    purchase.cardGenerationStatus === "completed";
  const canSendToRecipient = purchase.cardGenerationStatus === "completed";

  return (
    <>
      <AlertModal
        isOpen={!!resendEmailOpenType}
        onClose={() => setResendEmailOpenType(null)}
        onConfirm={() =>
          onConfirmResendEmail(resendEmailOpenType ?? "customer")
        }
        loading={loading}
        title={t(
          `purchases.table.resendEmail.${resendEmailOpenType ?? "customer"}.title`,
          { code: purchase.giftCardCode },
        )}
        description={t(
          `purchases.table.resendEmail.${resendEmailOpenType ?? "customer"}.description`,
          {
            code: purchase.giftCardCode ?? purchase.giftCardId,
            email:
              resendEmailOpenType === "customer"
                ? purchase.customer.email
                : (purchase.toEmail ?? purchase.customer.email),
          },
        )}
        continueButton={t(
          `purchases.table.resendEmail.${resendEmailOpenType ?? "customer"}.confirm`,
          { code: purchase.giftCardCode ?? purchase.giftCardId },
        )}
      />
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        loading={loading}
        title={t("purchases.table.delete.title")}
        description={t("purchases.table.delete.description", {
          code: purchase.giftCardCode,
        })}
        continueButton={t("purchases.table.delete.confirm")}
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
          {!isActive && (
            <DropdownMenuItem onClick={() => onSetStatus("active")}>
              <ToggleRight className="size-3.5" />{" "}
              {t("purchases.table.actions.setActive")}
            </DropdownMenuItem>
          )}
          {isActive && (
            <DropdownMenuItem onClick={() => onSetStatus("inactive")}>
              <ToggleLeft className="size-3.5" />{" "}
              {t("purchases.table.actions.setInactive")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onRegenerate("gift-card")}>
            <RefreshCcw className="size-3.5" />{" "}
            {t("purchases.table.actions.regenerateGiftCard")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRegenerate("invoice")}>
            <RefreshCw className="size-3.5" />{" "}
            {t("purchases.table.actions.regenerateInvoice")}
          </DropdownMenuItem>
          {canSendToCustomer && (
            <DropdownMenuItem onClick={() => openResendEmail("customer")}>
              <Send className="size-3.5" />{" "}
              {t("purchases.table.actions.resendEmailToCustomer")}
            </DropdownMenuItem>
          )}
          {canSendToRecipient && (
            <DropdownMenuItem onClick={() => openResendEmail("recipient")}>
              <SendHorizonal className="size-3.5" />{" "}
              {t("purchases.table.actions.resendEmailToRecipient")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canDelete && (
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-3.5" />{" "}
              {t("purchases.table.actions.delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
