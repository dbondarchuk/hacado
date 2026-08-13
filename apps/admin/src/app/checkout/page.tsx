import { CheckoutPlans } from "@/components/checkout/checkout-plans";
import { StepVerify } from "@/components/install/steps/step-verify";
import {
  getPolarBillingPlansFromEnv,
  POLAR_CHECKOUT_PLAN_BENEFIT_I18N_KEYS,
  POLAR_CHECKOUT_PLAN_INCLUDES_LOWER_TIER,
} from "@/config/polar-billing";
import { ensureBillingOrganizationForUser } from "@/lib/billing/ensure-billing-org";
import { organizationHasInstallBillingAccess } from "@/lib/billing/install-billing-access";
import { getI18nAsync } from "@hacado/i18n/server";
import { getPolarClient } from "@hacado/services";
import type { Product } from "@polar-sh/sdk/models/components/product";
import type { ProductPriceFixed } from "@polar-sh/sdk/models/components/productpricefixed";
import { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "../utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("install");
  return {
    title: t("checkout.pageTitle"),
    description: t("checkout.pageDescription"),
  };
}

function formatPriceParts(
  product: Product,
  t: (key: string) => string,
): { amount: string; period: string } | null {
  const price = product.prices.find(
    (p): p is ProductPriceFixed => p.amountType === "fixed" && !p.isArchived,
  );

  if (!price) return null;

  const amount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: price.priceCurrency,
  }).format(price.priceAmount / 100);

  if (product.isRecurring && product.recurringInterval) {
    const interval = product.recurringInterval;
    if (interval === "month")
      return { amount, period: t("checkout.pricePerMonth") };
    if (interval === "year")
      return { amount, period: t("checkout.pricePerYear") };
    if (interval === "week")
      return { amount, period: t("checkout.pricePerWeek") };
    if (interval === "day")
      return { amount, period: t("checkout.pricePerDay") };
  }

  return { amount, period: "" };
}

export default async function CheckoutPage() {
  const session = await getSession();
  const t = await getI18nAsync("install");

  const organizationInstalled = Boolean(
    (session.user as { organizationInstalled?: boolean }).organizationInstalled,
  );
  if (organizationInstalled) {
    redirect("/dashboard");
  }

  const emailVerified = Boolean(
    (session.user as { emailVerified?: boolean }).emailVerified,
  );

  const organizationId = (session.user as { organizationId?: string })
    .organizationId;

  const billingOk = await organizationHasInstallBillingAccess(organizationId);
  if (billingOk) {
    redirect("/install");
  }

  if (!emailVerified) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="border-b bg-card px-4 py-4 md:px-8">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <Image src="/logo.png" alt="Hacado" width={28} height={28} />
            <div className="text-xl font-semibold tracking-tight font-display">
              hacado
            </div>
          </div>
        </header>
        <StepVerify email={session.user.email} callbackURL="/checkout" />
      </div>
    );
  }

  let orgIdForCheckout: string;
  try {
    orgIdForCheckout = await ensureBillingOrganizationForUser();
  } catch {
    redirect("/auth/signin");
  }

  const planDefs = getPolarBillingPlansFromEnv();
  const productIds = planDefs.map((p) => p.productId);

  const list = await getPolarClient().listProducts({
    id: productIds,
    isArchived: false,
    limit: Math.min(100, Math.max(10, productIds.length)),
  });

  const byId = new Map(list.result.items.map((p) => [p.id, p]));
  const tierOrder: Record<string, number> = { free: 0, solo: 1, studio: 2 };
  const plans = planDefs
    .slice()
    .sort((a, b) => (tierOrder[a.slug] ?? 99) - (tierOrder[b.slug] ?? 99))
    .map((def) => {
      const product = byId.get(def.productId);
      const benefitKeys =
        POLAR_CHECKOUT_PLAN_BENEFIT_I18N_KEYS[def.slug] ??
        POLAR_CHECKOUT_PLAN_BENEFIT_I18N_KEYS.solo ??
        [];
      const benefits = benefitKeys.map((key) => t(key as any));
      const lowerTierSlug = POLAR_CHECKOUT_PLAN_INCLUDES_LOWER_TIER[def.slug];
      const includesLowerTierLabel = lowerTierSlug
        ? t("checkout.everythingInPlus", {
            tier: t.has(`checkout.plans.${lowerTierSlug}.title`)
              ? t(`checkout.plans.${lowerTierSlug}.title`)
              : lowerTierSlug,
          })
        : null;
      const priceParts = product
        ? formatPriceParts(product, t as (k: string) => string)
        : null;

      const cardTitle = t.has(`checkout.plans.${def.slug}.title`)
        ? t(`checkout.plans.${def.slug}.title`)
        : (product?.name ?? def.slug);
      const cardSubtitle = t.has(`checkout.plans.${def.slug}.subtitle`)
        ? t(`checkout.plans.${def.slug}.subtitle`)
        : (product?.description ?? null);

      if (!product) {
        return {
          productId: def.productId,
          slug: def.slug,
          name: def.slug,
          cardTitle,
          cardSubtitle,
          priceAmount: priceParts?.amount ?? null,
          pricePeriod: priceParts?.period ?? null,
          benefits,
          includesLowerTierLabel,
        };
      }
      return {
        productId: product.id,
        slug: def.slug,
        name: product.name,
        cardTitle,
        cardSubtitle,
        priceAmount: priceParts?.amount ?? null,
        pricePeriod: priceParts?.period ?? null,
        benefits,
        includesLowerTierLabel,
      };
    });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* <Image src="/logo.png" alt="Hacado" width={28} height={28} /> */}
            <div className="text-xl font-semibold tracking-tight font-display text-primary">
              hacado
            </div>
          </div>
          <div className="hidden text-base text-muted-foreground sm:block">
            {session.user.name}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("checkout.title")}
          </h1>
          <p className="text-muted-foreground">{t("checkout.subtitle")}</p>
          <p className="text-base text-muted-foreground">
            {t("checkout.cancellationPolicy")}
          </p>
        </div>
        <CheckoutPlans organizationId={orgIdForCheckout} plans={plans} />
      </main>
    </div>
  );
}
