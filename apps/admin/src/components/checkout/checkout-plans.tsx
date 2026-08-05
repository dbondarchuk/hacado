"use client";

import { createPolarCheckoutSession } from "@/components/checkout/actions";
import { PolarBillingPlanSlug } from "@/config/polar-billing";
import { InstallKeys, useI18n } from "@hacado/i18n/client";
import { Button, Spinner, toast } from "@hacado/ui";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

export type CheckoutPlanView = {
  productId: string;
  slug: PolarBillingPlanSlug;
  name: string;
  cardTitle: string;
  cardSubtitle: string | null;
  priceAmount: string | null;
  pricePeriod: string | null;
  benefits: string[];
  /** e.g. "Everything in Free plus:" — null for the base Free tier. */
  includesLowerTierLabel: string | null;
};

export function CheckoutPlans({
  organizationId,
  plans,
}: {
  organizationId: string;
  plans: CheckoutPlanView[];
}) {
  const t = useI18n("install");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const productIds = plans.map((p) => p.productId);

  const startCheckout = async (productId: string) => {
    setLoadingId(productId);
    const result = await createPolarCheckoutSession({
      productId,
      organizationId,
      productIds,
    });
    if (!result.ok) {
      toast.error(t("checkout.checkoutError"));
      setLoadingId(null);
      return;
    }
    window.location.assign(result.url);
  };

  const gridClass =
    plans.length <= 1
      ? "mx-auto w-full max-w-md"
      : plans.length === 2
        ? "mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2"
        : "grid w-full gap-8 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={gridClass}>
      {plans.map((plan) => {
        const badgeKey = `checkout.plans.${plan.slug}.badge` as InstallKeys;
        const hasBadge = t.has(badgeKey);
        const isRecommended = plan.slug === "solo";
        return (
          <div
            key={plan.productId}
            className={
              isRecommended
                ? "relative flex flex-col rounded-xl border-2 border-primary bg-card p-6 shadow-sm md:p-7"
                : "relative flex flex-col rounded-xl border border-neutral-200/80 bg-card p-6 shadow-sm md:p-7"
            }
          >
            {hasBadge ? (
              <span
                className={
                  isRecommended
                    ? "absolute -top-3 left-6 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground"
                    : "absolute -top-3 left-6 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-foreground"
                }
              >
                {t(badgeKey)}
              </span>
            ) : null}
            <div className="mb-5 flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm">
                <Sparkles className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="text-xl font-semibold leading-tight text-foreground">
                  {plan.cardTitle}
                </h2>
                {plan.cardSubtitle ? (
                  <p className="mt-1 text-base text-muted-foreground">
                    {plan.cardSubtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {plan.priceAmount ? (
              <div className="mb-5 rounded-lg bg-accent px-4 py-4">
                <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-accent-foreground">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {plan.priceAmount}
                  </span>
                  {plan.pricePeriod ? (
                    <span className="text-base font-normal text-muted-foreground">
                      {plan.pricePeriod}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}

            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {plan.includesLowerTierLabel ?? t("checkout.includedLabel")}
            </p>
            <ul className="mb-6 flex flex-1 flex-col gap-2.5">
              {plan.benefits.map((line, i) => (
                <li
                  key={`${plan.productId}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-neutral-200/90 bg-background px-3 py-2.5 text-base leading-snug text-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full rounded-lg border-0"
              variant="brand-dark"
              size="lg"
              onClick={() => void startCheckout(plan.productId)}
              disabled={loadingId !== null}
            >
              {loadingId === plan.productId ? <Spinner /> : null}
              {t.has(`checkout.plans.${plan.slug}.cta`)
                ? t(`checkout.plans.${plan.slug}.cta`)
                : t("checkout.cta")}
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {t("checkout.disclaimer")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
