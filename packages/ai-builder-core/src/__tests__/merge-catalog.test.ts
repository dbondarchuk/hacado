import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import { mergeBlockCatalogs } from "../adapters/from-editor-blocks";
import { selectBusinessSlice } from "../context/assembler";

describe("catalog merge and business slice", () => {
  it("lets apps override core when they redefine the same type", () => {
    const schema = z.object({});
    const merged = mergeBlockCatalogs(
      [
        {
          type: "BookingModern",
          displayName: "Booking",
          category: "blocks",
          providerName: "core",
          schema,
        },
      ],
      [
        {
          type: "BookingModern",
          displayName: "Booking with waitlist",
          category: "apps",
          providerName: "waitlist",
          schema,
          defaultMetadata: { waitlistAppId: "app-1" },
        },
        {
          type: "BlogPostList",
          displayName: "Blog",
          category: "apps",
          providerName: "blog",
          schema,
        },
      ],
    );

    assert.equal(merged.length, 2);
    assert.equal(
      merged.find((block) => block.type === "BookingModern")?.providerName,
      "waitlist",
    );
    assert.deepEqual(
      merged.find((block) => block.type === "BookingModern")?.defaultMetadata,
      { waitlistAppId: "app-1" },
    );

    assert.equal(
      merged.find((block) => block.type === "BlogPostList")?.providerName,
      "blog",
    );
  });

  it("selects only requested business fields", () => {
    const slice = selectBusinessSlice(
      {
        general: {
          name: "Nail Studio",
          email: "hello@example.com",
          phone: "123",
        },
        brand: { title: "Studio", description: "About us" },
        social: { links: [{ type: "instagram", url: "https://ig" }] },
        addons: [{ id: "a1", name: "Gel", price: 15 }],
      },
      ["profile", "branding"],
    );

    assert.equal(slice.name, "Nail Studio");
    assert.equal(slice.brandTitle, "Studio");
    assert.equal(slice.email, undefined);
    assert.equal(slice.socialLinks, undefined);
    assert.equal(slice.addons, undefined);
  });

  it("includes addons when requested", () => {
    const slice = selectBusinessSlice(
      {
        addons: [
          {
            id: "a1",
            name: "Gel",
            price: 15,
            duration: 20,
            serviceIds: ["s1"],
            memberIds: ["m1"],
            staffSource: "services",
          },
        ],
      },
      ["addons"],
    );

    assert.equal(slice.addons?.[0]?.name, "Gel");
    assert.equal(slice.addons?.[0]?.price, 15);
    assert.deepEqual(slice.addons?.[0]?.serviceIds, ["s1"]);
    assert.deepEqual(slice.addons?.[0]?.memberIds, ["m1"]);
  });

  it("includes packages, members, and staff links when requested", () => {
    const slice = selectBusinessSlice(
      {
        members: [{ id: "m1", name: "Alex", jobTitle: "Stylist" }],
        services: [
          {
            id: "s1",
            name: "Haircut",
            price: 40,
            addonIds: ["a1"],
            memberIds: ["m1"],
            staffSource: "assigned",
          },
        ],
        packages: [
          {
            id: "p1",
            name: "5 Cuts",
            price: 150,
            included: [{ serviceId: "s1", name: "Haircut", credits: 5 }],
            memberIds: ["m1"],
            staffSource: "included-services",
          },
        ],
      },
      ["members", "services", "packages"],
    );

    assert.equal(slice.members?.[0]?.name, "Alex");
    assert.deepEqual(slice.services?.[0]?.addonIds, ["a1"]);
    assert.deepEqual(slice.services?.[0]?.memberIds, ["m1"]);
    assert.equal(slice.packages?.[0]?.staffSource, "included-services");
    assert.equal(slice.packages?.[0]?.included?.[0]?.credits, 5);
    assert.equal(slice.addons, undefined);
  });
});
