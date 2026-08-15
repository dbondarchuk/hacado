"use client";

import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import { toast } from "@hacado/ui";
import { useRouter } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect } from "react";

/** Shows a success toast after Polar redirects back with `seats_purchased=true`. */
export function SeatsPurchaseSuccessToast() {
  const t = useI18n("admin");
  const router = useRouter();
  const [seatsPurchased, setSeatsPurchased] = useQueryState(
    "seats_purchased",
    parseAsBoolean
      .withDefault(false)
      .withOptions({ shallow: true, history: "replace" }),
  );

  useEffect(() => {
    if (!seatsPurchased) return;
    toast.success(t("team.seatsPurchase.purchaseSuccess"));
    setSeatsPurchased(false);
    void authClient.getSession({
      query: { disableCookieCache: true },
    });
    router.refresh();
  }, [t, seatsPurchased, setSeatsPurchased, router]);

  return null;
}
