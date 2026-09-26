"use client";

import { Button } from "@hacado/ui";
import { useRouter } from "next/navigation";
import React from "react";
import { ManualPurchaseDialog } from "./purchases/components/manual-purchase-form";

export function GiftCardStudioManualPurchaseQuickLink({
  appId,
  label,
  icon,
  className,
}: {
  appId?: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  if (!appId) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {icon}
        {label}
      </Button>
      <ManualPurchaseDialog
        appId={appId}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
