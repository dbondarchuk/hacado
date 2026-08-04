import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

describe("subscription entitlements", () => {
  before(() => {
    process.env.POLAR_BILLING_PLANS =
      "free:prod_free,solo:prod_solo,studio:prod_studio";
  });

  it("resolves plan tier from product id", async () => {
    const { resolvePlanTierFromProductId } = await import(
      "./subscription-entitlements"
    );

    assert.equal(resolvePlanTierFromProductId("prod_free"), "free");
    assert.equal(resolvePlanTierFromProductId("prod_solo"), "solo");
    assert.equal(resolvePlanTierFromProductId("prod_studio"), "studio");
    assert.equal(
      resolvePlanTierFromProductId("prod_solo", { feesExempt: true }),
      "studio",
    );
    assert.equal(resolvePlanTierFromProductId(null), null);
    assert.equal(resolvePlanTierFromProductId("prod_unknown"), "solo");
  });

  it("gates non-app features by plan tier", async () => {
    const { canUseFeature } = await import("./subscription-entitlements");

    assert.equal(canUseFeature("solo", "financials"), true);
    assert.equal(canUseFeature("studio", "financials"), true);
    assert.equal(canUseFeature("free", "financials"), false);
    assert.equal(canUseFeature("free", "sms"), true);
    assert.equal(canUseFeature(null, "discounts"), true);
  });

  it("limits free tier services", async () => {
    const { canCreateMoreServices, canCreateMorePages, FREE_TIER_LIMITS } =
      await import("@timelish/types");

    assert.equal(FREE_TIER_LIMITS.services, 1);
    assert.equal(FREE_TIER_LIMITS.appointments, 15);
    assert.equal(FREE_TIER_LIMITS.pages, 10);
    assert.equal(canCreateMoreServices("free", 0), true);
    assert.equal(canCreateMoreServices("free", 1), false);
    assert.equal(canCreateMoreServices("solo", 5), true);
    assert.equal(canCreateMoreServices("studio", 5), true);
    assert.equal(canCreateMoreServices(null, 10), true);
    assert.equal(canCreateMorePages("free", 9), true);
    assert.equal(canCreateMorePages("free", 10), false);
    assert.equal(canCreateMorePages("solo", 50), true);
  });

  it("resolves tier from organization", async () => {
    const { resolvePlanTierFromOrganization } = await import(
      "./subscription-entitlements"
    );

    assert.equal(
      resolvePlanTierFromOrganization({
        polarSubscriptionProductId: "prod_free",
      }),
      "free",
    );
    assert.equal(
      resolvePlanTierFromOrganization({
        polarSubscriptionProductId: "prod_solo",
        feesExempt: false,
      }),
      "solo",
    );
    assert.equal(
      resolvePlanTierFromOrganization({
        polarSubscriptionProductId: "prod_studio",
      }),
      "studio",
    );
    assert.equal(
      resolvePlanTierFromOrganization({
        polarSubscriptionProductId: "prod_free",
        feesExempt: true,
      }),
      "studio",
    );
  });

  it("maps legacy pro/team env slugs to solo/studio", async () => {
    process.env.POLAR_BILLING_PLANS =
      "free:prod_free,pro:prod_legacy_pro,team:prod_legacy_team";
    // Re-import won't re-run module; call getPolarBillingPlansFromEnv fresh
    const { getPolarBillingPlansFromEnv } = await import("./plan-config");
    const plans = getPolarBillingPlansFromEnv();
    assert.deepEqual(
      plans.map((p) => p.slug),
      ["free", "solo", "studio"],
    );
  });
});
