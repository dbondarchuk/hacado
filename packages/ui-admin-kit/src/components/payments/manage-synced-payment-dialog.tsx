"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { HydratedSyncedPayment } from "@timelish/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
  toastPromise,
} from "@timelish/ui";
import React, { useCallback, useEffect, useState } from "react";
import { AssignAppointmentDialog } from "./assign-appointment-dialog";
import { EditSyncedPaymentAmountsDialog } from "./edit-synced-payment-amounts-dialog";
import { SyncedPaymentCard } from "./synced-payment-card";

type ManageSyncedPaymentDialogProps = {
  /** Preloaded synced payment (e.g. from the review queue). */
  payment?: HydratedSyncedPayment;
  /** Provider transaction id used to look up the synced payment when not preloaded. */
  externalId?: string;
  /** Called after any action updates the synced payment or linked payments. */
  onUpdated?: () => void;
  /** When provided, renders a trigger and manages its own open state. */
  children?: React.ReactNode;
  /** Controlled open state (used without a trigger). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ManageSyncedPaymentDialog = ({
  payment: preloaded,
  externalId,
  onUpdated,
  children,
  open: controlledOpen,
  onOpenChange,
}: ManageSyncedPaymentDialogProps) => {
  const t = useI18n("admin");

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChange],
  );

  const [record, setRecord] = useState<HydratedSyncedPayment | null>(
    preloaded ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const loadRecord = useCallback(async () => {
    if (preloaded) {
      setRecord(preloaded);
      return preloaded;
    }

    if (!externalId) {
      setRecord(null);
      return null;
    }

    setLoading(true);
    try {
      const result = await adminApi.syncedPayments.listSyncedPayments({
        externalId,
        limit: 1,
      });
      const item = result.items[0] ?? null;
      setRecord(item);
      return item;
    } catch {
      setRecord(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [preloaded, externalId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    loadRecord();
  }, [open, loadRecord]);

  useEffect(() => {
    if (!open) {
      setAssignOpen(false);
      setEditOpen(false);
    }
  }, [open]);

  const runAction = async (
    action: () => Promise<unknown>,
    options?: { closeOnSuccess?: boolean; reload?: boolean },
  ) => {
    const { closeOnSuccess = true, reload = true } = options ?? {};
    setPending(true);
    try {
      await toastPromise(action(), {
        success: t("syncedPayments.toast.success"),
        error: t("syncedPayments.toast.error"),
      });
      if (reload) {
        await loadRecord();
      }
      onUpdated?.();
      if (closeOnSuccess) {
        setOpen(false);
      }
    } catch {
      // toastPromise already surfaced the error
    } finally {
      setPending(false);
    }
  };

  const handleAssign = (appointmentId: string) => {
    if (!record) {
      return;
    }
    return runAction(() =>
      record.appointmentId
        ? adminApi.syncedPayments.reassignSyncedPayment(
            record._id,
            appointmentId,
          )
        : adminApi.syncedPayments.assignSyncedPayment(
            record._id,
            appointmentId,
          ),
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{t("syncedPayments.manageDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("syncedPayments.manageDialog.description")}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : !record ? (
            <p className="px-6 py-12 text-center text-base text-muted-foreground">
              {t("syncedPayments.editAmounts.notFound")}
            </p>
          ) : (
            <div className="px-6 pb-6">
              <SyncedPaymentCard
                payment={record}
                disabled={pending}
                onConfirm={() =>
                  runAction(() =>
                    adminApi.syncedPayments.confirmSyncedPayment(record._id),
                  )
                }
                onReject={() =>
                  runAction(() =>
                    adminApi.syncedPayments.rejectSyncedPayment(record._id),
                  )
                }
                onIgnore={() =>
                  runAction(() =>
                    adminApi.syncedPayments.ignoreSyncedPayment(record._id),
                  )
                }
                onAssignSuggestion={handleAssign}
                onAssignOther={() => setAssignOpen(true)}
                onEditAmounts={() => setEditOpen(true)}
              />
            </div>
          )}

          {!loading && record && (
            <div className="flex justify-end border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("common.buttons.close")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {record && (
        <>
          <AssignAppointmentDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            referenceDate={record.transactionTime}
            currentAppointmentId={record.appointmentId}
            onConfirm={handleAssign}
          />
          <EditSyncedPaymentAmountsDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            payment={record}
            onUpdated={async () => {
              await loadRecord();
              onUpdated?.();
            }}
          />
        </>
      )}
    </>
  );
};
