import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { checkRateLimit, resetRateLimitsForTests } from "../rate-limit/memory";

describe("rate limit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests under the limit", () => {
    const first = checkRateLimit({
      key: "org-1",
      limit: 2,
      windowMs: 60_000,
      now: 1000,
    });

    const second = checkRateLimit({
      key: "org-1",
      limit: 2,
      windowMs: 60_000,
      now: 1001,
    });

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);
  });

  it("blocks when limit exceeded", () => {
    checkRateLimit({ key: "org-1", limit: 1, windowMs: 60_000, now: 1000 });
    const blocked = checkRateLimit({
      key: "org-1",
      limit: 1,
      windowMs: 60_000,
      now: 1001,
    });

    assert.equal(blocked.allowed, false);
  });
});
