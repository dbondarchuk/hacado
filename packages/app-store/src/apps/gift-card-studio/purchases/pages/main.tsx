"use client";

import { adminApi } from "@hacado/api-sdk";
import { Payment } from "@hacado/types";
import { dispatchDashboardBadge, useReload } from "@hacado/ui-admin";
import { PaymentDetailsDialog } from "@hacado/ui-admin-kit";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getPurchasedGiftCardById,
  markGiftCardStudioPurchasesRead,
} from "../../actions";
import { GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY } from "../../const";
import { PurchasedGiftCardListModel } from "../../models";
import { ManualPurchaseDialog } from "../components/manual-purchase-form";
import { GiftCardDetailDialog } from "../table/gift-card-detail-dialog";
import { PurchasesTable } from "../table/table";
import { PurchasesTableAction } from "../table/table-action";

export function PurchasesMainPage({ appId }: { appId: string }) {
  const searchParams = useSearchParams();
  const [manualPurchaseOpen, setManualPurchaseOpen] = useState(false);
  const [purchase, setPurchase] = useState<PurchasedGiftCardListModel | null>(
    null,
  );
  const [detailsPayment, setDetailsPayment] = useState<Payment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { reload } = useReload();
  const router = useRouter();

  useEffect(() => {
    void markGiftCardStudioPurchasesRead(appId).then(() => {
      dispatchDashboardBadge({
        key: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY,
        count: 0,
      });
    });
  }, [appId]);

  useEffect(() => {
    if (searchParams.get("openManual") === "1") {
      setManualPurchaseOpen(true);
    }

    if (searchParams.get("purchaseId")) {
      void getPurchasedGiftCardById(
        appId,
        searchParams.get("purchaseId")!,
      ).then((purchase) => {
        setPurchase(purchase);
      });
    }

    const paymentId = searchParams.get("paymentId");
    if (paymentId) {
      void adminApi.payments
        .getPayment(paymentId)
        .then((payment) => {
          setDetailsPayment(payment);
          setDetailsOpen(true);
          const next = new URLSearchParams(searchParams.toString());
          next.delete("paymentId");
          const query = next.toString();
          router.replace(query ? `?${query}` : "?");
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [appId, router, searchParams]);

  const handleManualPurchaseSuccess = useCallback(
    async (created?: PurchasedGiftCardListModel) => {
      reload();

      if (
        created?.paymentMethod === "payment-link" &&
        created.paymentId &&
        created.paymentStatus === "pending"
      ) {
        try {
          const payment = await adminApi.payments.getPayment(created.paymentId);
          setDetailsPayment(payment);
          setDetailsOpen(true);
        } catch (error) {
          console.error(error);
        }
      }
    },
    [reload],
  );

  const onPurchaseOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      setPurchase(null);
      router.replace("?");
    },
    [purchase],
  );

  return (
    <div className="flex flex-col flex-1 gap-8">
      <PurchasesTableAction
        appId={appId}
        onOpenManualPurchase={() => setManualPurchaseOpen(true)}
      />
      <PurchasesTable appId={appId} />
      <ManualPurchaseDialog
        appId={appId}
        open={manualPurchaseOpen}
        onOpenChange={setManualPurchaseOpen}
        onSuccess={handleManualPurchaseSuccess}
      />
      {purchase && (
        <GiftCardDetailDialog
          purchase={purchase}
          open
          onOpenChange={onPurchaseOpenChange}
        />
      )}
      {detailsPayment ? (
        <PaymentDetailsDialog
          payment={detailsPayment}
          open={detailsOpen}
          onOpenChange={(next) => {
            setDetailsOpen(next);
            if (!next) {
              setDetailsPayment(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
