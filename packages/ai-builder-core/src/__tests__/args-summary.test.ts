import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeTemplateArgs } from "../context/args-summary";

describe("summarizeTemplateArgs", () => {
  it("collects nested mustache-friendly paths", () => {
    const summary = summarizeTemplateArgs({
      customer: { name: "Ada", email: "ada@example.com" },
      addons: [{ name: "Gel" }, { name: "Art" }],
      websiteUrl: "https://example.com",
    });

    assert.ok(summary);
    assert.ok(summary!.paths.includes("customer.name"));
    assert.ok(summary!.paths.includes("customer.email"));
    assert.ok(summary!.paths.includes("addons"));
    assert.ok(summary!.paths.includes("websiteUrl"));
    assert.equal((summary!.sample.customer as { name: string }).name, "Ada");
  });

  it("returns undefined for empty args", () => {
    assert.equal(summarizeTemplateArgs({}), undefined);
    assert.equal(summarizeTemplateArgs(null), undefined);
  });
});
