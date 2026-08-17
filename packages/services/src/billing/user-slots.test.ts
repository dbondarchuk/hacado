import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canInviteWithAvailableUsers,
  hasUnlimitedUserSlots,
  membershipLimitFromAvailableUsers,
  resolveAvailableUsers,
  UNLIMITED_MEMBERSHIP_LIMIT,
} from "./user-slots";

describe("user slots", () => {
  it("treats fees-exempt orgs as unlimited", () => {
    assert.equal(hasUnlimitedUserSlots({ feesExempt: true }), true);
    assert.equal(hasUnlimitedUserSlots({ feesExempt: false }), false);
    assert.equal(hasUnlimitedUserSlots({}), false);
    assert.equal(hasUnlimitedUserSlots(null), false);
    assert.equal(
      resolveAvailableUsers({ feesExempt: true, availableUsers: 1 }),
      null,
    );
    assert.equal(
      canInviteWithAvailableUsers(
        50,
        resolveAvailableUsers({ feesExempt: true }),
      ),
      true,
    );
    assert.equal(
      membershipLimitFromAvailableUsers(null),
      UNLIMITED_MEMBERSHIP_LIMIT,
    );
  });

  it("uses the Polar ledger when not fees-exempt", () => {
    assert.equal(resolveAvailableUsers({ availableUsers: 5 }), 5);
    assert.equal(
      resolveAvailableUsers({ userSlots: { included: 5, additional: 3 } }),
      8,
    );
    assert.equal(resolveAvailableUsers({}), 1);
    assert.equal(canInviteWithAvailableUsers(1, 1), false);
    assert.equal(canInviteWithAvailableUsers(0, 1), true);
    assert.equal(membershipLimitFromAvailableUsers(5), 5);
  });
});
