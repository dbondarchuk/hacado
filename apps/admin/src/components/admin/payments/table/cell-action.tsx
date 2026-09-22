"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { InStorePaymentUpdateModel, PaymentSummary } from "@hacado/types";
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
import { useAuth } from "@hacado/ui-admin";
import {
  AddUpdatePaymentDialog,
  canRefundPayment,
  ManageSyncedPaymentDialog,
  PaymentLinkQrCodeDialog,
  PaymentRefundDialog,
  ResendPaymentLinkDialog,
} from "@hacado/ui-admin-kit";
import { canManageSyncedPayments } from "@hacado/utils";
import {
  Calendar,
  Copy,
  Edit,
  MoreHorizontal,
  QrCode,
  RotateCcw,
  Send,
  Trash,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface CellActionProps {
  payment: PaymentSummary;
}

export const CellAction: React.FC<CellActionProps> = ({ payment }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const { user } = useAuth();
  const canManageSynced = canManageSyncedPayments(user);
  const [loading, setLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { method, status, appointmentId, disableUpdate, source, externalId } =
    payment as PaymentSummary & {
      disableUpdate?: boolean;
      source?: string;
      externalId?: string;
    };

  const syncedExternalId = useMemo(() => {
    if (
      method === "in-person-card" &&
      source === "synced" &&
      externalId &&
      status === "paid"
    ) {
      return externalId;
    }
    return undefined;
  }, [method, source, externalId, status]);

  const isPendingPaymentLink =
    method === "payment-link" && status === "pending";

  const canUpdateInStore =
    method !== "online" &&
    method !== "gift-card" &&
    method !== "payment-link" &&
    !disableUpdate;

  const canRefund = canRefundPayment(payment);

  const hasActions =
    !!appointmentId ||
    canUpdateInStore ||
    !!syncedExternalId ||
    canRefund ||
    isPendingPaymentLink;

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await toastPromise(adminApi.payments.deleteInstore(payment._id), {
        success: t("payment.card.deleteSuccess"),
        error: t("common.toasts.error"),
      });
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onCopyLink = async () => {
    try {
      setLoading(true);
      await toastPromise(
        (async () => {
          const { url } = await adminApi.payments.getPaymentLinkUrl(
            payment._id,
          );
          await navigator.clipboard.writeText(url);
        })(),
        {
          success: t("payment.card.linkCopied"),
          error: t("common.toasts.error"),
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onCancelLink = async () => {
    try {
      setLoading(true);
      await toastPromise(adminApi.payments.cancelPaymentLink(payment._id), {
        success: t("common.toasts.saved"),
        error: t("common.toasts.error"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasActions) {
    return null;
  }

  return (
    <>
      <AlertModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("paymentsList.table.cellAction.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {appointmentId && (
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/appointments/${appointmentId}`}
                className="text-foreground"
              >
                <Calendar className="size-3.5" />{" "}
                {t("paymentsList.table.cellAction.viewAppointment")}
              </Link>
            </DropdownMenuItem>
          )}
          {isPendingPaymentLink && (
            <>
              <PaymentLinkQrCodeDialog paymentId={payment._id}>
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  disabled={loading}
                >
                  <QrCode className="size-3.5" /> {t("payment.card.showQrCode")}
                </DropdownMenuItem>
              </PaymentLinkQrCodeDialog>
              <DropdownMenuItem onClick={onCopyLink} disabled={loading}>
                <Copy className="size-3.5" /> {t("payment.card.copyLink")}
              </DropdownMenuItem>
              <ResendPaymentLinkDialog
                payment={payment}
                onSuccess={() => router.refresh()}
              >
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  disabled={loading}
                >
                  <Send className="size-3.5" /> {t("payment.card.resendLink")}
                </DropdownMenuItem>
              </ResendPaymentLinkDialog>
              <DropdownMenuItem onClick={onCancelLink} disabled={loading}>
                <XCircle className="size-3.5" /> {t("payment.card.cancelLink")}
              </DropdownMenuItem>
            </>
          )}
          {canUpdateInStore && (
            <>
              <AddUpdatePaymentDialog
                paymentId={payment._id}
                payment={payment as InStorePaymentUpdateModel}
                onSuccess={() => router.refresh()}
              >
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <Edit className="size-3.5" />{" "}
                  {t("paymentsList.table.cellAction.update")}
                </DropdownMenuItem>
              </AddUpdatePaymentDialog>
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                <Trash className="size-3.5" />{" "}
                {t("paymentsList.table.cellAction.delete")}
              </DropdownMenuItem>
            </>
          )}
          {canManageSynced && syncedExternalId && (
            <ManageSyncedPaymentDialog
              externalId={syncedExternalId}
              onUpdated={() => router.refresh()}
            >
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <Edit className="size-3.5" />{" "}
                {t("paymentsList.table.cellAction.manageSyncedPayment")}
              </DropdownMenuItem>
            </ManageSyncedPaymentDialog>
          )}
          {canRefund && (
            <PaymentRefundDialog payment={payment}>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <RotateCcw className="size-3.5" />{" "}
                {t("paymentsList.table.cellAction.refund")}
              </DropdownMenuItem>
            </PaymentRefundDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
