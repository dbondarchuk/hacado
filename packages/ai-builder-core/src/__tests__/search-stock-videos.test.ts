import type { TEditorBlock } from "@hacado/builder/editor-types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import { createRegistryAdapter } from "../adapters";
import { executeBuilderAITool } from "../tools/executor";
import type { SelectionContextPayload } from "../types";

const document = {
  id: "root",
  type: "PageLayout",
  data: { props: {}, childrenIds: [] },
} as unknown as TEditorBlock;

const selection: SelectionContextPayload = {
  builder: "page",
  documentRevision: "rev",
  selectionType: "document",
  selectedBlockIds: [],
  selectedBlockTypes: [],
};

function createAdapter() {
  return createRegistryAdapter({
    builder: "page",
    blocks: [
      {
        type: "Video",
        displayName: "Video",
        category: "content",
        tags: ["video"],
        schema: z.object({
          props: z.object({
            src: z.string(),
            poster: z.string().optional(),
          }),
        }),
        providerName: "core",
      },
    ],
  });
}

describe("searchStockVideos tool", () => {
  it("returns unavailable when no searchStockVideos callback is wired", async () => {
    const result = (await executeBuilderAITool(
      "searchStockVideos",
      { query: "spa massage", count: 4 },
      {
        adapter: createAdapter(),
        document,
        selection,
      },
    )) as {
      available: boolean;
      providers: string[];
      items: unknown[];
      hint?: string;
    };

    assert.equal(result.available, false);
    assert.deepEqual(result.providers, []);
    assert.deepEqual(result.items, []);
    assert.match(String(result.hint ?? ""), /not configured/i);
  });

  it("delegates to the injected searchStockVideos callback", async () => {
    const result = (await executeBuilderAITool(
      "searchStockVideos",
      { query: "hair salon", count: 2 },
      {
        adapter: createAdapter(),
        document,
        selection,
        searchStockVideos: async ({ query, count }) => ({
          available: true,
          providers: ["pexels"],
          items: [
            {
              id: "pexels:1",
              provider: "pexels",
              url: "https://videos.pexels.com/video-files/1.mp4",
              posterUrl: "https://images.pexels.com/videos/1.jpg",
              alt: query,
            },
          ].slice(0, count),
        }),
      },
    )) as {
      available: boolean;
      providers: string[];
      items: Array<{ url: string; alt: string; posterUrl?: string }>;
    };

    assert.equal(result.available, true);
    assert.deepEqual(result.providers, ["pexels"]);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.alt, "hair salon");
    assert.match(result.items[0]?.url ?? "", /pexels/);
    assert.match(result.items[0]?.posterUrl ?? "", /pexels/);
  });

  it("clamps count before calling the callback", async () => {
    let seenCount: number | undefined;

    await executeBuilderAITool(
      "searchStockVideos",
      { query: "nails", count: 99 },
      {
        adapter: createAdapter(),
        document,
        selection,
        searchStockVideos: async ({ count }) => {
          seenCount = count;
          return { available: true, providers: [], items: [] };
        },
      },
    );

    assert.equal(seenCount, 12);
  });
});
