import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canUsePackageForAppointment,
  pickDefaultCustomerPackage,
  summarizePackageItems,
  type CustomerPackage,
} from "./appointment-package";

const itemId = "111111111111111111111111";
const serviceId = "222222222222222222222222";
const memberId = "333333333333333333333333";

function makePackage(
  overrides: Partial<CustomerPackage> = {},
): CustomerPackage {
  const now = new Date("2026-08-19T12:00:00.000Z");
  return {
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    organizationId: "org",
    customerId: "cust",
    packageId: "pkg",
    name: "10x Massage",
    description: "Ten sessions",
    price: 500,
    items: [
      {
        _id: itemId,
        serviceId,
        credits: 10,
        creditsPerRedemption: 1,
        optionName: "Massage",
      },
    ],
    purchasedAt: now,
    status: "active",
    channel: "customer",
    remainingByItem: { [itemId]: 10 },
    totalCredits: 10,
    remainingCredits: 10,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("package eligibility", () => {
  it("allows assigned staff when no member allowlist is set", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage(),
      serviceId,
      memberId,
      appointmentDate: new Date("2026-08-20T12:00:00.000Z"),
      optionStaffMemberIds: [memberId],
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.credits, 1);
      assert.equal(result.item._id, itemId);
    }
  });

  it("rejects expired packages", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage({
        expiresAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      serviceId,
      memberId,
      appointmentDate: new Date("2026-08-20T12:00:00.000Z"),
      optionStaffMemberIds: [memberId],
      now: new Date("2026-08-19T12:00:00.000Z"),
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "customer_package_expired");
  });

  it("rejects when the option is not included", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage(),
      serviceId: "444444444444444444444444",
      memberId,
      appointmentDate: new Date(),
      optionStaffMemberIds: [memberId],
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "option_not_included");
  });

  it("rejects staff outside the package allowlist", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage({ eligibleMemberIds: [memberId] }),
      serviceId,
      memberId: "555555555555555555555555",
      appointmentDate: new Date(),
      optionStaffMemberIds: [memberId, "555555555555555555555555"],
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "member_not_eligible");
  });

  it("rejects staff not assigned to the option", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage(),
      serviceId,
      memberId,
      appointmentDate: new Date(),
      optionStaffMemberIds: ["555555555555555555555555"],
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "member_not_eligible");
  });

  it("rejects when remaining credits are insufficient", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage({
        remainingByItem: { [itemId]: 0 },
        remainingCredits: 0,
        status: "exhausted",
      }),
      serviceId,
      memberId,
      appointmentDate: new Date(),
      optionStaffMemberIds: [memberId],
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "customer_package_exhausted");
  });

  it("picks the soonest-expiring package first", () => {
    const later = makePackage({
      _id: "bbbbbbbbbbbbbbbbbbbbbbbb",
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
      purchasedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const sooner = makePackage({
      _id: "cccccccccccccccccccccccc",
      expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      purchasedAt: new Date("2026-06-01T00:00:00.000Z"),
    });

    assert.equal(pickDefaultCustomerPackage([later, sooner])?._id, sooner._id);
  });

  it("allows redemption when remaining equals credits per visit", () => {
    const result = canUsePackageForAppointment({
      customerPackage: makePackage({
        remainingByItem: { [itemId]: 1 },
        remainingCredits: 1,
      }),
      serviceId,
      memberId,
      appointmentDate: new Date(),
      optionStaffMemberIds: [memberId],
    });

    assert.equal(result.ok, true);
  });
});

describe("summarizePackageItems", () => {
  it("maps package items to service names and skips unknown options", () => {
    const next = summarizePackageItems(
      [
        {
          _id: itemId,
          serviceId,
          credits: 10,
          creditsPerRedemption: 1,
        },
        {
          _id: "444444444444444444444444",
          serviceId: "555555555555555555555555",
          credits: 3,
          creditsPerRedemption: 1,
        },
      ],
      [{ _id: serviceId, name: "Massage" }],
    );

    assert.deepEqual(next, [
      { serviceId, name: "Massage", credits: 10, duration: undefined },
    ]);
  });

  it("includes fixed service duration", () => {
    const next = summarizePackageItems(
      [
        {
          _id: itemId,
          serviceId,
          credits: 5,
          creditsPerRedemption: 1,
        },
      ],
      [
        {
          _id: serviceId,
          name: "Massage",
          durationType: "fixed",
          duration: 60,
        },
      ],
    );

    assert.deepEqual(next, [
      { serviceId, name: "Massage", credits: 5, duration: 60 },
    ]);
  });
});
