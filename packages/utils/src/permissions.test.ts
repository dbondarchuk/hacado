import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { subscriptionAllowsMultipleUsers } from "./permissions";

describe("subscriptionAllowsMultipleUsers", () => {
  it("allows multiple users for fees-exempt orgs regardless of seat ledger", () => {
    assert.equal(subscriptionAllowsMultipleUsers(1, true), true);
    assert.equal(subscriptionAllowsMultipleUsers(undefined, true), true);
  });

  it("uses available seat count when not fees-exempt", () => {
    assert.equal(subscriptionAllowsMultipleUsers(1), false);
    assert.equal(subscriptionAllowsMultipleUsers(5), true);
    assert.equal(subscriptionAllowsMultipleUsers(undefined), false);
    assert.equal(subscriptionAllowsMultipleUsers(1, false), false);
  });
});
