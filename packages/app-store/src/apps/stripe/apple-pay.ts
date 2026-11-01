/**
 * Apple Pay domain association for Stripe (Payment Element on the web).
 * Copy the file from Stripe Dashboard → Settings → Payment methods → Apple Pay, or
 * set env (hex string / blob as for other processors in this repo).
 *
 * Test vs live is determined by the platform `STRIPE_SECRET_KEY` prefix
 * (`sk_test` / `sk_live`), not the connected account’s OAuth `livemode` flag.
 */
export function isStripePlatformTestMode(): boolean {
  const k = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return k.startsWith("sk_test");
}

export function getStripeApplePayDomainAssociation(): string | null {
  const test = isStripePlatformTestMode();
  const forMode = test
    ? process.env.STRIPE_APPLE_PAY_DOMAIN_ASSOCIATION_TEST?.trim()
    : process.env.STRIPE_APPLE_PAY_DOMAIN_ASSOCIATION_LIVE?.trim();

  const fallback = process.env.STRIPE_APPLE_PAY_DOMAIN_ASSOCIATION?.trim();
  return forMode ?? fallback ?? null;
}
