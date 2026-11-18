import type { Redis } from "ioredis";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StockMediaProvider } from "./stock-media.provider";

const fakeRedis = {
  get: async () => null,
  setex: async () => "OK",
} as unknown as Redis;

describe("StockMediaProvider", () => {
  it("supportsMediaType reflects provider capabilities", () => {
    const provider = new StockMediaProvider(fakeRedis);

    assert.equal(provider.supportsMediaType("unsplash", "photo"), true);
    assert.equal(provider.supportsMediaType("unsplash", "video"), false);
    assert.equal(provider.supportsMediaType("pexels", "photo"), true);
    assert.equal(provider.supportsMediaType("pexels", "video"), true);
  });

  it("searchImages returns unavailable when neither provider key is configured", async () => {
    const prevUnsplash = process.env.UNSPLASH_ACCESS_KEY;
    const prevPexels = process.env.PEXELS_API_KEY;
    delete process.env.UNSPLASH_ACCESS_KEY;
    delete process.env.PEXELS_API_KEY;

    try {
      const provider = new StockMediaProvider(fakeRedis);
      const result = await provider.searchImages({
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

  it("searchVideos returns unavailable when Pexels is not configured", async () => {
    const prevPexels = process.env.PEXELS_API_KEY;
    delete process.env.PEXELS_API_KEY;

    try {
      const provider = new StockMediaProvider(fakeRedis);
      const result = await provider.searchVideos({
        query: "yoga studio",
        count: 3,
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
