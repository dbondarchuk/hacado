import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compactToolResult } from "../orchestration/tool-result-compact";

describe("compactToolResult", () => {
  it("passes through small payloads", () => {
    const raw = compactToolResult({ ok: true, n: 1 });
    assert.equal(JSON.parse(raw).ok, true);
  });

  it("truncates large discovery payloads", () => {
    const raw = compactToolResult(
      {
        blob: "x".repeat(20_000),
      },
      "getBlockSchemas",
    );

    const parsed = JSON.parse(raw);

    assert.equal(parsed.truncated, true);
    assert.ok(parsed.originalChars > 8_000);
    assert.ok(typeof parsed.preview === "string");
  });

  it("does not truncate cloneBlockForInsert trees", () => {
    const payload = { found: true, block: { data: "y".repeat(20_000) } };
    const raw = compactToolResult(payload, "cloneBlockForInsert");

    assert.equal(JSON.parse(raw).found, true);
    assert.equal(raw.includes("truncated"), false);
  });
});
