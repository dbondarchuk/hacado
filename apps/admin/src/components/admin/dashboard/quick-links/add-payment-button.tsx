"use client";

import { AddUpdatePaymentDialog } from "@hacado/ui-admin-kit/payments";
import { Button } from "@hacado/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

export function QuickLinkAddPaymentButton({
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

  return (
    <AddUpdatePaymentDialog
      open={controlledOpen}
      onOpenChange={onOpenChange}
      onSuccess={() => router.refresh()}
    >
      {controlledOpen === undefined ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          aria-label={label}
        >
          {icon}
          {label}
        </Button>
      ) : null}
    </AddUpdatePaymentDialog>
  );
}
