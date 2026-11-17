import type { Redis } from "ioredis";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchStockVideosForAI } from "./search-stock-videos-for-ai";

const fakeRedis = {
  get: async () => null,
  setex: async () => "OK",
} as unknown as Redis;

describe("searchStockVideosForAI", () => {
  it("returns unavailable when Pexels key is not configured", async () => {
    const prevPexels = process.env.PEXELS_API_KEY;
    delete process.env.PEXELS_API_KEY;

    try {
      const result = await searchStockVideosForAI(fakeRedis, {
        query: "spa massage",
        count: 4,
      });

      assert.equal(result.available, false);
      assert.deepEqual(result.providers, []);
      assert.deepEqual(result.items, []);
      assert.match(String(result.hint ?? ""), /not configured/i);
    } finally {
      if (prevPexels === undefined) delete process.env.PEXELS_API_KEY;
      else process.env.PEXELS_API_KEY = prevPexels;
    }
  });
});
