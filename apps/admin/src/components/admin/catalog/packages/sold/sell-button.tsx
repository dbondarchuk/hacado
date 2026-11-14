"use client";

import { useI18n } from "@hacado/i18n/client";
import { TableToolbarActionLabel } from "@hacado/ui-admin/data-table";
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
      <Button
        type="button"
        size="sm"
        variant="default"
        onClick={() => setSellOpen(true)}
        aria-label={t("catalog.packages.sell")}
      >
        <ShoppingCart />
        <TableToolbarActionLabel>
          {t("catalog.packages.sell")}
        </TableToolbarActionLabel>
      </Button>
      <SellPackageDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
