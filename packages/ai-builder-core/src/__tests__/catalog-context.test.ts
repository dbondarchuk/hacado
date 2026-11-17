import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCatalogSummary } from "../orchestration/catalog-context";

describe("catalog context", () => {
  it("summarizes catalog counts and names", () => {
    const summary = buildCatalogSummary({
      members: [{ id: "m1", name: "Alex" }],
      services: [{ id: "s1", name: "Cut", staffSource: "assigned" }],
      addons: [],
      packages: [],
    });

    assert.equal(summary.members, 1);
    assert.deepEqual(summary.memberNames, ["Alex"]);
    assert.deepEqual(summary.serviceNames, ["Cut"]);
  });
});
