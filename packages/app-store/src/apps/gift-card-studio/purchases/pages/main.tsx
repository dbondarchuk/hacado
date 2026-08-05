"use client";

import { dispatchDashboardBadge, useReload } from "@hacado/ui-admin";
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
  }, [searchParams]);

  const handleManualPurchaseSuccess = useCallback(() => {
    reload();
  }, [reload]);

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
    </div>
  );
}
