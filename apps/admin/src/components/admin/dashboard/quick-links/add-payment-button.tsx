"use client";

import { Button } from "@hacado/ui";
import { AddUpdatePaymentDialog } from "@hacado/ui-admin-kit";
import { useRouter } from "next/navigation";
import React from "react";

export function QuickLinkAddPaymentButton({
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

  return (
    <AddUpdatePaymentDialog onSuccess={() => router.refresh()}>
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
    </AddUpdatePaymentDialog>
  );
}
