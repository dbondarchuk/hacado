"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerPackageListModel } from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const clampUsed = (value: number, min: number, max: number) =>
  Math.min(
    max,
    Math.max(min, Number.isFinite(value) ? Math.trunc(value) : min),
  );

export const canAdjustCustomerPackageCredits = (
  pkg: CustomerPackageListModel,
) => pkg.status !== "cancelled" && !!pkg.items[0]?._id;

type AdjustPackageCreditsDialogProps = {
  pkg: CustomerPackageListModel;
  children?: React.ReactNode;
};

export const AdjustPackageCreditsDialog: React.FC<
  AdjustPackageCreditsDialogProps
> = ({ pkg, children }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(pkg.usedCredits);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const item = pkg.items[0];
  const itemId = item?._id;

  const { minUsed, maxUsed } = useMemo(() => {
    if (!item || !itemId) {
      return { minUsed: 0, maxUsed: pkg.totalCredits };
    }
    const itemRemaining = pkg.remainingByItem[itemId] ?? 0;
    return {
      minUsed: Math.max(0, pkg.usedCredits - (item.credits - itemRemaining)),
      maxUsed: Math.min(pkg.totalCredits, pkg.usedCredits + itemRemaining),
    };
  }, [item, itemId, pkg.remainingByItem, pkg.totalCredits, pkg.usedCredits]);

  useEffect(() => {
    if (open) {
      setUsed(pkg.usedCredits);
      setReason("");
    }
  }, [open, pkg.usedCredits]);

  if (!canAdjustCustomerPackageCredits(pkg)) {
    return null;
  }

  const setUsedClamped = (next: number) => {
    setUsed(clampUsed(next, minUsed, maxUsed));
  };

  const onSaveUsed = async () => {
    if (!itemId || used === pkg.usedCredits) return;
    const delta = pkg.usedCredits - used;
    setLoading(true);
    try {
      await toastPromise(
        adminApi.packages.adjustCustomerPackage(pkg._id, {
          itemId,
          delta,
          reason: reason.trim() || undefined,
        }),
        {
          success: t("services.packages.form.toasts.changesSaved"),
          error: t("services.packages.form.toasts.requestError"),
        },
      );
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" size="sm" variant="outline">
            {t("services.packages.adjust.title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("services.packages.adjust.title")}</DialogTitle>
          <DialogDescription>
            {t("services.packages.adjust.description", {
              name: pkg.name,
              total: pkg.totalCredits,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("services.packages.adjust.usedLabel")}</Label>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={loading || used <= minUsed}
                onClick={() => setUsedClamped(used - 1)}
                aria-label={t("services.packages.adjust.decrease")}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                min={minUsed}
                max={maxUsed}
                step={1}
                value={used}
                disabled={loading}
                className="w-20 text-center"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setUsed(minUsed);
                    return;
                  }
                  setUsedClamped(e.target.valueAsNumber);
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={loading || used >= maxUsed}
                onClick={() => setUsedClamped(used + 1)}
                aria-label={t("services.packages.adjust.increase")}
              >
                <Plus className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("services.packages.adjust.ofTotal", {
                  total: pkg.totalCredits,
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`adjust-reason-${pkg._id}`}>
              {t("services.packages.adjust.reason")}
            </Label>
            <Input
              id={`adjust-reason-${pkg._id}`}
              value={reason}
              disabled={loading}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("services.packages.adjust.reasonPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={loading}>
              {t("common.buttons.close")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={loading || used === pkg.usedCredits}
            onClick={onSaveUsed}
          >
            {loading ? <Spinner className="size-4" /> : null}
            {t("services.packages.adjust.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
