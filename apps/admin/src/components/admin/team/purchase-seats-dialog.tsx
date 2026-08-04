"use client";

import {
  createUserSeatCheckoutSession,
  listUserSeatProductOffers,
  type UserSeatProductOffer,
} from "@/app/dashboard/settings/team/user-seat-actions";
import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  Spinner,
  cn,
  toast,
} from "@timelish/ui";
import { BadgeDollarSign, Lock } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";

function pickBestValueProductId(
  products: UserSeatProductOffer[],
): string | null {
  if (products.length === 0) return null;
  const ranked = products.filter((p) => p.usersAmount > 0 && p.priceAmount > 0);

  if (ranked.length === 0) {
    return products[0]!.productId;
  }

  let best = ranked[0]!;
  let bestRatio = best.priceAmount / best.usersAmount;
  for (const product of ranked) {
    const ratio = product.priceAmount / product.usersAmount;
    if (ratio < bestRatio) {
      best = product;
      bestRatio = ratio;
    } else if (ratio === bestRatio && product.usersAmount > best.usersAmount) {
      best = product;
    }
  }
  return best.productId;
}

function savingsPercentByProductId(
  products: UserSeatProductOffer[],
): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  const valid = products.filter((p) => p.usersAmount > 0 && p.priceAmount > 0);

  if (valid.length < 2) {
    return map;
  }

  const pricePerSeat = (p: UserSeatProductOffer) =>
    p.priceAmount / p.usersAmount;
  const maxPricePerSeat = Math.max(...valid.map(pricePerSeat));
  if (maxPricePerSeat <= 0) {
    return map;
  }

  for (const product of valid) {
    const pps = pricePerSeat(product);
    const percent = Math.round((1 - pps / maxPricePerSeat) * 100);
    map.set(product.productId, Math.max(0, Math.min(100, percent)));
  }

  return map;
}

export function PurchaseSeatsDialog({
  canPurchase,
  triggerVariant = "default",
  returnTo = "/dashboard/settings/team",
}: {
  canPurchase: boolean;
  triggerVariant?: "default" | "outline" | "primary";
  /** Absolute app path for Polar checkout return/success. */
  returnTo?: "/dashboard/settings/team" | "/dashboard/settings/brand";
}) {
  const t = useI18n("admin");
  const [purchaseSeats, setPurchaseSeats] = useQueryState(
    "purchase_seats",
    parseAsBoolean
      .withDefault(false)
      .withOptions({ shallow: true, history: "replace" }),
  );

  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [products, setProducts] = useState<UserSeatProductOffer[] | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!purchaseSeats) return;
    setOpen(true);
    setPurchaseSeats(false);
  }, [purchaseSeats, setPurchaseSeats]);

  const money = useCallback(
    (amount: number, currency: string) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(amount / 100),
    [locale],
  );

  const bestValueProductId = useMemo(
    () => (products?.length ? pickBestValueProductId(products) : null),
    [products],
  );

  const savePercentages = useMemo(
    () => (products?.length ? savingsPercentByProductId(products) : new Map()),
    [products],
  );

  useEffect(() => {
    if (!open || !canPurchase) return;
    const fn = async () => {
      setLoading(true);
      try {
        const res = await listUserSeatProductOffers();
        if (!res.ok) {
          throw new Error(
            `Failed to list user seat product offers: ${res.code}`,
          );
        }

        setProducts(res.products);
        setSelectedProductId(
          pickBestValueProductId(res.products) ??
            res.products[0]?.productId ??
            null,
        );
      } catch (error) {
        console.error(error);
        toast.error(t("team.seatsPurchase.loadError"));
        setProducts([]);
        setSelectedProductId(null);
        setOpen(false);
        return;
      } finally {
        setLoading(false);
      }
    };
    void fn();
  }, [open, canPurchase, t]);

  const onContinue = async () => {
    if (!selectedProductId) return;
    setCheckoutId(selectedProductId);
    const result = await createUserSeatCheckoutSession({
      productId: selectedProductId,
      returnTo,
    });

    setCheckoutId(null);
    if (!result.ok) {
      toast.error(t("team.seatsPurchase.checkoutError"));
      return;
    }

    setOpen(false);
    window.location.assign(result.url);
  };

  if (!canPurchase) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant}>
          <BadgeDollarSign />
          {t("team.seatsPurchase.buyButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="px-6 pb-4 pt-6 pr-12 sm:pr-14">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle>{t("team.seatsPurchase.dialogTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-1 pt-1 text-base text-muted-foreground">
                <span>{t("team.seatsPurchase.dialogSubtitle")}</span>
                <span>{t("team.seatsPurchase.dialogNote")}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex min-h-32 flex-col gap-0 px-6 pb-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <p className="text-base text-muted-foreground">
              {t("team.seatsPurchase.empty")}
            </p>
          ) : (
            <RadioGroup
              value={selectedProductId ?? undefined}
              onValueChange={setSelectedProductId}
              className="grid gap-3"
              disabled={checkoutId !== null}
            >
              {products.map((p) => {
                const isSelected = selectedProductId === p.productId;
                const isBestValue = bestValueProductId === p.productId;
                const savePercent = savePercentages.get(p.productId) ?? 0;
                const subline =
                  p.description?.trim() ||
                  t("team.seatsPurchase.seatsLine", {
                    count: p.usersAmount,
                  });
                return (
                  <div key={p.productId} className="relative overflow-visible">
                    {isBestValue ? (
                      <div
                        className="absolute left-2 top-0 z-20 -translate-y-1/2 sm:left-3.5"
                        aria-label={t("team.seatsPurchase.bestValueBadge")}
                      >
                        <span className="inline-block whitespace-nowrap rounded-md border border-primary bg-primary px-2 py-0.5 text-[11px] font-bold uppercase leading-tight tracking-wide text-primary-foreground sm:text-[12px]">
                          {t("team.seatsPurchase.bestValueBadge")}
                        </span>
                      </div>
                    ) : null}
                    <Label
                      htmlFor={`user-seat-${p.productId}`}
                      className={cn(
                        "flex cursor-pointer items-stretch gap-3 rounded-lg border p-3 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                          : "border-border bg-background hover:border-muted-foreground/35",
                      )}
                    >
                      <div className="flex shrink-0 items-start pt-0.5">
                        <RadioGroupItem
                          value={p.productId}
                          id={`user-seat-${p.productId}`}
                          className="border-primary"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold leading-tight text-foreground">
                            {p.name}
                          </span>
                        </div>
                        {subline ? (
                          <p className="mt-0.5 text-base text-muted-foreground">
                            {subline}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 self-start text-right">
                        <div className="flex min-w-0 flex-col items-end gap-0.5">
                          {savePercent > 0 ? (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {t("team.seatsPurchase.savePercent", {
                                percent: savePercent,
                              })}
                            </span>
                          ) : null}
                          <span className="text-base font-semibold tabular-nums text-foreground">
                            {money(p.priceAmount, p.priceCurrency)}
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>
        <div className="mt-1 flex flex-col gap-4 border-t p-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:max-w-[min(100%,28rem)]">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("team.seatsPurchase.securePaymentLabel")}
            </span>
            <span className="text-muted-foreground/50" aria-hidden>
              ·
            </span>
            <span>{t("team.seatsPurchase.billedRecurring")}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={checkoutId !== null}
            >
              {t("common.buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={
                !selectedProductId ||
                checkoutId !== null ||
                loading ||
                !products ||
                products.length === 0
              }
              onClick={() => void onContinue()}
            >
              {checkoutId ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4 shrink-0 animate-spin" />
                  {t("team.seatsPurchase.continue")}
                </span>
              ) : (
                t("team.seatsPurchase.continue")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
