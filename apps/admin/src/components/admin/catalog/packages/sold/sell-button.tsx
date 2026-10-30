"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SellPackageDialog } from "../sell-dialog";

export function SellPackageButton() {
  const t = useI18n("admin");
  const router = useRouter();
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setSellOpen(true)}>
        <ShoppingCart /> {t("catalog.packages.sell")}
      </Button>
      <SellPackageDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
