"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Manual purchase is now done via the dialog on the purchases page.
 * Redirect /purchases/new to /purchases with query to open the dialog.
 */
export const PurchaseNewPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/gift-card-studio/purchases?openManual=1");
  }, [router]);

  return null;
};
