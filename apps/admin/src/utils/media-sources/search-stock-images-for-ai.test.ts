import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Redis } from "ioredis";
import { searchStockImagesForAI } from "./search-stock-images-for-ai";

const fakeRedis = {
  get: async () => null,
  setex: async () => "OK",
} as unknown as Redis;

describe("searchStockImagesForAI", () => {
  it("returns unavailable when neither provider key is configured", async () => {
    const prevUnsplash = process.env.UNSPLASH_ACCESS_KEY;
    const prevPexels = process.env.PEXELS_API_KEY;
    delete process.env.UNSPLASH_ACCESS_KEY;
    delete process.env.PEXELS_API_KEY;

    try {
      const result = await searchStockImagesForAI(fakeRedis, {
        query: "spa massage",
        count: 4,
      });

      assert.equal(result.available, false);
      assert.deepEqual(result.providers, []);
      assert.deepEqual(result.items, []);
      assert.match(String(result.hint ?? ""), /not configured/i);
    } finally {
      if (prevUnsplash === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
      else process.env.UNSPLASH_ACCESS_KEY = prevUnsplash;

      if (prevPexels === undefined) delete process.env.PEXELS_API_KEY;
      else process.env.PEXELS_API_KEY = prevPexels;
    }
  });
});
