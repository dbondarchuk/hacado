import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  notificationAudienceMatches,
  subscriptionAllowsMultipleUsers,
} from "./permissions";

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

describe("notificationAudienceMatches", () => {
  const staff = { memberId: "member-staff", role: "staff" as const };
  const otherStaff = { memberId: "member-other", role: "staff" as const };
  const coordinator = {
    memberId: "member-coord",
    role: "coordinator" as const,
  };

  const owner = { memberId: "member-owner", role: "owner" as const };

  it("allows everyone when audience is omitted", () => {
    assert.equal(notificationAudienceMatches(staff, undefined), true);
    assert.equal(notificationAudienceMatches(staff, null), true);
  });

  it("scopes appointment audience to assignee for staff", () => {
    assert.equal(
      notificationAudienceMatches(staff, {
        appointmentMemberId: "member-staff",
      }),
      true,
    );

    assert.equal(
      notificationAudienceMatches(otherStaff, {
        appointmentMemberId: "member-staff",
      }),
      false,
    );
  });

  it("allows updateAll roles for any appointmentMemberId", () => {
    assert.equal(
      notificationAudienceMatches(coordinator, {
        appointmentMemberId: "member-staff",
      }),
      true,
    );

    assert.equal(
      notificationAudienceMatches(owner, {
        appointmentMemberId: "member-staff",
      }),
      true,
    );
  });

  it("gates billing:read to owner/admin", () => {
    const billingAudience = {
      requiredPermissions: [
        { resource: "billing" as const, action: "read" as const },
      ],
    };

    assert.equal(notificationAudienceMatches(owner, billingAudience), true);
    assert.equal(
      notificationAudienceMatches(coordinator, billingAudience),
      false,
    );

    assert.equal(notificationAudienceMatches(staff, billingAudience), false);
  });

  it("requires all requiredPermissions (company app install)", () => {
    const companyAppAudience = {
      requiredPermissions: [
        { resource: "app" as const, action: "install" as const },
        { resource: "app" as const, action: "useCompany" as const },
      ],
    };

    assert.equal(notificationAudienceMatches(owner, companyAppAudience), true);

    assert.equal(
      notificationAudienceMatches(coordinator, companyAppAudience),
      false,
    );

    assert.equal(notificationAudienceMatches(staff, companyAppAudience), false);
  });

  it("filters by memberIds", () => {
    assert.equal(
      notificationAudienceMatches(staff, {
        memberIds: ["member-staff", "member-owner"],
      }),
      true,
    );

    assert.equal(
      notificationAudienceMatches(otherStaff, {
        memberIds: ["member-staff"],
      }),
      false,
    );
  });

  it("ANDs appointment and permission constraints", () => {
    assert.equal(
      notificationAudienceMatches(staff, {
        appointmentMemberId: "member-staff",
        requiredPermissions: [
          { resource: "billing" as const, action: "read" as const },
        ],
      }),
      false,
    );

    assert.equal(
      notificationAudienceMatches(owner, {
        appointmentMemberId: "member-staff",
        requiredPermissions: [
          { resource: "billing" as const, action: "read" as const },
        ],
      }),
      true,
    );
  });
});
