"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  DateRange,
  HydratedSyncedPayment,
  SyncedPaymentStatus,
} from "@hacado/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  CalendarDateRangePicker,
  Link,
  Skeleton,
  Spinner,
  toastPromise,
  useTimeZone,
} from "@hacado/ui";
import { useAuth } from "@hacado/ui-admin";
import {
  AssignAppointmentDialog,
  EditSyncedPaymentAmountsDialog,
  SyncedPaymentCard,
} from "@hacado/ui-admin-kit";
import { canManageSyncedPayments } from "@hacado/utils";
import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const NEEDS_REVIEW: SyncedPaymentStatus[] = ["matched", "unmatched"];
const PAGE_SIZE = 20;

export const SyncedPaymentsReview = () => {
  const t = useI18n("admin");
  const timeZone = useTimeZone();
  const { user } = useAuth();
  const canManage = canManageSyncedPayments(user);

  const searchParams = useSearchParams();
  const externalId = searchParams.get("externalId") || undefined;

  const [items, setItems] = useState<HydratedSyncedPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(!!externalId);
  const [page, setPage] = useState(0);
  const [range, setRange] = useState<DateRange | undefined>();
  const [assignTarget, setAssignTarget] =
    useState<HydratedSyncedPayment | null>(null);
  const [editTarget, setEditTarget] = useState<HydratedSyncedPayment | null>(
    null,
  );
  const [approvingAll, setApprovingAll] = useState(false);
  const [approveAllOpen, setApproveAllOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.syncedPayments.listSyncedPayments({
        status: showAll ? undefined : NEEDS_REVIEW,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        start: range?.start,
        end: range?.end,
        externalId,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [showAll, page, range, externalId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [showAll, range]);

  const approveAll = useCallback(async () => {
    setApprovingAll(true);
    try {
      const result = await toastPromise(
        adminApi.syncedPayments.confirmAllMatchedSyncedPayments({
          start: range?.start,
          end: range?.end,
          externalId,
        }),
        {
          success: (data) =>
            t("syncedPayments.toast.approveAllSuccess", {
              count: data.count,
            }),
          error: t("syncedPayments.toast.approveAllError"),
        },
      );

      if (result.count > 0) {
        setTimeout(async () => {
          await load();
        }, 300);
      }

      setApproveAllOpen(false);
    } catch {
      // toastPromise already surfaced the error
    } finally {
      setApprovingAll(false);
    }
  }, [externalId, load, range, t]);

  const runAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setPendingId(id);
      try {
        await toastPromise(action(), {
          success: t("syncedPayments.toast.success"),
          error: t("syncedPayments.toast.error"),
        });

        setTimeout(async () => {
          await load();
        }, 300);
      } catch {
        // toastPromise already surfaced the error
      } finally {
        setPendingId(null);
      }
    },
    [load, t],
  );

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE + items.length);
  const hasNextPage = (page + 1) * PAGE_SIZE < total;

  return (
    <div className="flex flex-col gap-4">
      {externalId && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-4 py-2 text-base">
          <span className="text-muted-foreground">
            {t("syncedPayments.filters.singleTransaction")}
          </span>
          <Link href="/dashboard/financials/inbox" variant="underline">
            {t("syncedPayments.filters.viewAll")}
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={showAll ? "outline" : "default"}
            size="sm"
            onClick={() => setShowAll(false)}
          >
            {t("syncedPayments.filters.needsReview")}
          </Button>
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll(true)}
          >
            {t("syncedPayments.filters.all")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && !showAll && (
            <Button
              size="sm"
              disabled={loading || approvingAll || pendingId !== null}
              onClick={() => setApproveAllOpen(true)}
            >
              <Check />
              {t("syncedPayments.actions.approveAll")}
            </Button>
          )}
          <CalendarDateRangePicker
            range={range}
            onChange={setRange}
            timeZone={timeZone}
            className="w-auto min-w-56"
          />
          {(range?.start || range?.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRange(undefined)}
            >
              {t("syncedPayments.filters.clearDates")}
            </Button>
          )}
        </div>
      </div>

      {!loading && items.length === 0 ? (
        <p className="text-base text-muted-foreground py-12 text-center">
          {t("syncedPayments.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-56" />
              ))
            : items.map((item) => (
                <SyncedPaymentCard
                  key={item._id}
                  payment={item}
                  disabled={pendingId === item._id || approvingAll}
                  onConfirm={
                    canManage
                      ? () =>
                          runAction(item._id, () =>
                            adminApi.syncedPayments.confirmSyncedPayment(
                              item._id,
                            ),
                          )
                      : undefined
                  }
                  onReject={
                    canManage
                      ? () =>
                          runAction(item._id, () =>
                            adminApi.syncedPayments.rejectSyncedPayment(
                              item._id,
                            ),
                          )
                      : undefined
                  }
                  onIgnore={
                    canManage
                      ? () =>
                          runAction(item._id, () =>
                            adminApi.syncedPayments.ignoreSyncedPayment(
                              item._id,
                            ),
                          )
                      : undefined
                  }
                  onAssignSuggestion={
                    canManage
                      ? (appointmentId) =>
                          runAction(item._id, () =>
                            item.appointmentId
                              ? adminApi.syncedPayments.reassignSyncedPayment(
                                  item._id,
                                  appointmentId,
                                )
                              : adminApi.syncedPayments.assignSyncedPayment(
                                  item._id,
                                  appointmentId,
                                ),
                          )
                      : undefined
                  }
                  onAssignOther={
                    canManage ? () => setAssignTarget(item) : undefined
                  }
                  onEditAmounts={
                    canManage ? () => setEditTarget(item) : undefined
                  }
                />
              ))}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-sm text-muted-foreground">
            {t("syncedPayments.pagination.summary", { from, to, total })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              {t("syncedPayments.pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              {t("syncedPayments.pagination.next")}
            </Button>
          </div>
        </div>
      )}

      <AssignAppointmentDialog
        open={assignTarget !== null}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        referenceDate={assignTarget?.transactionTime}
        currentAppointmentId={assignTarget?.appointmentId}
        onConfirm={async (appointmentId) => {
          if (!assignTarget) {
            return;
          }
          const target = assignTarget;
          setAssignTarget(null);
          await runAction(target._id, () =>
            target.appointmentId
              ? adminApi.syncedPayments.reassignSyncedPayment(
                  target._id,
                  appointmentId,
                )
              : adminApi.syncedPayments.assignSyncedPayment(
                  target._id,
                  appointmentId,
                ),
          );
        }}
      />

      {editTarget && (
        <EditSyncedPaymentAmountsDialog
          open={editTarget !== null}
          onOpenChange={(open) => !open && setEditTarget(null)}
          payment={editTarget}
          onUpdated={() => load()}
        />
      )}

      <AlertDialog
        open={approveAllOpen}
        onOpenChange={(open) => {
          if (!open && approvingAll) {
            return;
          }
          setApproveAllOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("syncedPayments.approveAllDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("syncedPayments.approveAllDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approvingAll}>
              {t("syncedPayments.approveAllDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={approveAll} disabled={approvingAll}>
                {approvingAll && <Spinner />}
                {t("syncedPayments.approveAllDialog.confirm")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
