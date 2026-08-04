"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { PaymentSummary } from "@timelish/types";
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
import { useAuth } from "@timelish/ui-admin";
import {
  AddUpdatePaymentDialog,
  canRefundPayment,
  ManageSyncedPaymentDialog,
  PaymentRefundDialog,
} from "@timelish/ui-admin-kit";
import { canManageSyncedPayments } from "@timelish/utils";
import { Calendar, Edit, MoreHorizontal, RotateCcw, Trash } from "lucide-react";
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

  const canUpdateInStore =
    method !== "online" && method !== "gift-card" && !disableUpdate;

  const canRefund = canRefundPayment(payment);

  const hasActions =
    !!appointmentId || canUpdateInStore || !!syncedExternalId || canRefund;

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
          {canUpdateInStore && (
            <>
              <AddUpdatePaymentDialog
                paymentId={payment._id}
                payment={payment as any}
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
