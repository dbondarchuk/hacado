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
  open: controlledOpen,
  onOpenChange,
}: {
  appId?: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };

  if (!appId) {
    return null;
  }

  return (
    <>
      {controlledOpen === undefined ? (
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
      ) : null}
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
