import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

describe("app subscription plan access", () => {
  before(() => {
    process.env.POLAR_BILLING_PLANS = "free:prod_free,solo:prod_solo";
  });

  it("uses each app's minimumPlanTier", async () => {
    const { canInstallApp, canProcessApp, getAppMinimumPlanTier } = await import(
      "./subscription-plan-access"
    );
    const { BillingPlanTier } = await import("@timelish/types");

    assert.equal(getAppMinimumPlanTier("stripe"), BillingPlanTier.Solo);
    assert.equal(getAppMinimumPlanTier("google-calendar"), BillingPlanTier.Free);
    assert.equal(canInstallApp("free", "stripe"), false);
    assert.equal(canInstallApp("free", "blog"), false);
    assert.equal(canInstallApp("free", "google-calendar"), true);
    assert.equal(canInstallApp("free", "text-belt"), false);
    assert.equal(
      canInstallApp("free", "customer-text-message-notification"),
      true,
    );
    assert.equal(canProcessApp("free", "waitlist"), false);
    assert.equal(canInstallApp("solo", "stripe"), true);
  });
});
