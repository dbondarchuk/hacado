import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bookingCatalogNodeSchema,
  filterCatalogNodes,
  flattenCatalogOptionIds,
  flattenCatalogPackageIds,
  moveCatalogNode,
  normalizeCatalogNodes,
  type BookingCatalogNode,
} from "./index";

const tree = (): BookingCatalogNode[] => [
  { type: "option", id: "svc-a", optionId: "aaa" },
  {
    type: "group",
    id: "group-1",
    name: "Massage",
    children: [{ type: "package", id: "pkg-1", packageId: "ppp" }],
  },
  { type: "option", id: "svc-b", optionId: "bbb" },
];

describe("moveCatalogNode", () => {
  it("moves a service into a group", () => {
    const next = moveCatalogNode(tree(), "svc-a", "group-1");
    assert.equal(next[0].type, "group");
    assert.equal(
      next[0].type === "group" && next[0].children.at(-1)?.id,
      "svc-a",
    );
  });

  it("moves a package from a group to the root beside a service", () => {
    const next = moveCatalogNode(tree(), "pkg-1", "svc-b");
    assert.equal(
      next.some((node) => node.type === "package" && node.id === "pkg-1"),
      true,
    );
    const group = next.find((node) => node.id === "group-1");
    assert.equal(group?.type === "group" && group.children.length, 0);
  });

  it("does not nest groups", () => {
    const next = moveCatalogNode(tree(), "group-1", "svc-a");
    assert.equal(next.find((node) => node.id === "group-1")?.type, "group");
  });
});

describe("catalog leaf ids", () => {
  it("collects services and packages across root and groups", () => {
    const catalog: BookingCatalogNode[] = [
      { type: "option", id: "svc-a", optionId: "aaa" },
      {
        type: "group",
        id: "group-1",
        name: "Massage",
        children: [
          { type: "package", id: "pkg-1", packageId: "ppp" },
          { type: "option", id: "svc-b", optionId: "bbb" },
        ],
      },
    ];
    assert.deepEqual(flattenCatalogOptionIds(catalog), ["aaa", "bbb"]);
    assert.deepEqual(flattenCatalogPackageIds(catalog), ["ppp"]);
  });

  it("skips empty ids", () => {
    const catalog: BookingCatalogNode[] = [
      { type: "option", id: "svc-a", optionId: "" },
      { type: "package", id: "pkg-1", packageId: "" },
    ];
    assert.deepEqual(flattenCatalogOptionIds(catalog), []);
    assert.deepEqual(flattenCatalogPackageIds(catalog), []);
  });
});

describe("bookingCatalogNodeSchema", () => {
  it("accepts group description null from persisted config", () => {
    const catalog = [
      {
        type: "group" as const,
        id: "group-1",
        name: "Massage",
        description: null,
        children: [],
      },
    ];
    const parsed = bookingCatalogNodeSchema.array().safeParse(catalog);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data[0].type, "group");
      assert.equal(
        parsed.data[0].type === "group"
          ? parsed.data[0].description
          : "missing",
        undefined,
      );
    }
  });

  it("defaults missing group children instead of invalid_union", () => {
    const parsed = bookingCatalogNodeSchema
      .array()
      .safeParse([{ type: "group", id: "group-1", name: "Massage" }]);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data[0].type, "group");
      assert.deepEqual(
        parsed.data[0].type === "group" ? parsed.data[0].children : null,
        [],
      );
    }
  });
});

describe("normalizeCatalogNodes", () => {
  it("fills missing children on groups", () => {
    const next = normalizeCatalogNodes([
      { type: "group", id: "group-1", name: "Massage" } as BookingCatalogNode,
    ]);
    assert.deepEqual(next, [
      { type: "group", id: "group-1", name: "Massage", children: [] },
    ]);
  });
});

describe("filterCatalogNodes", () => {
  it("drops packages and empty groups for waitlist", () => {
    const next = filterCatalogNodes(tree(), { excludePackages: true });
    assert.deepEqual(
      next.map((node) => node.id),
      ["svc-a", "svc-b"],
    );
  });

  it("drops groups whose services are filtered out", () => {
    const catalog: BookingCatalogNode[] = [
      { type: "option", id: "svc-a", optionId: "aaa" },
      {
        type: "group",
        id: "group-1",
        name: "Massage",
        children: [{ type: "option", id: "svc-b", optionId: "bbb" }],
      },
    ];
    const next = filterCatalogNodes(catalog, { optionIds: ["aaa"] });
    assert.deepEqual(
      next.map((node) => node.id),
      ["svc-a"],
    );
  });

  it("keeps a group that still has a service after filtering packages", () => {
    const catalog: BookingCatalogNode[] = [
      {
        type: "group",
        id: "group-1",
        name: "Massage",
        children: [
          { type: "package", id: "pkg-1", packageId: "ppp" },
          { type: "option", id: "svc-b", optionId: "bbb" },
        ],
      },
    ];
    const next = filterCatalogNodes(catalog, { excludePackages: true });
    assert.equal(next.length, 1);
    assert.equal(next[0].type === "group" && next[0].children.length, 1);
    assert.equal(next[0].type === "group" && next[0].children[0].id, "svc-b");
  });
});
