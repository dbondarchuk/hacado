import type { TEditorBlock } from "@hacado/builder/editor-types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import { createRegistryAdapter } from "../adapters";
import { executeBuilderAITool } from "../tools/executor";
import type { SelectionContextPayload } from "../types";

const document = {
  id: "root",
  type: "EmailLayout",
  data: { props: {}, childrenIds: [] },
} as unknown as TEditorBlock;

const selection: SelectionContextPayload = {
  builder: "email",
  documentRevision: "rev",
  selectionType: "document",
  selectedBlockIds: [],
  selectedBlockTypes: [],
};

function createAdapter() {
  return createRegistryAdapter({
    builder: "email",
    blocks: [
      {
        type: "Image",
        displayName: "Image",
        category: "content",
        tags: ["image"],
        schema: z.object({
          props: z.object({
            src: z.string(),
            alt: z.string().optional(),
          }),
        }),
        providerName: "core",
      },
    ],
  });
}

describe("searchStockImages tool", () => {
  it("returns unavailable when no searchStockImages callback is wired", async () => {
    const result = (await executeBuilderAITool(
      "searchStockImages",
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

  it("delegates to the injected searchStockImages callback", async () => {
    const result = (await executeBuilderAITool(
      "searchStockImages",
      { query: "hair salon", count: 2 },
      {
        adapter: createAdapter(),
        document,
        selection,
        searchStockImages: async ({ query, count }) => ({
          available: true,
          providers: ["unsplash"],
          items: [
            {
              id: "unsplash:1",
              provider: "unsplash",
              url: "https://images.unsplash.com/photo-1",
              alt: query,
            },
          ].slice(0, count),
        }),
      },
    )) as {
      available: boolean;
      providers: string[];
      items: Array<{ url: string; alt: string }>;
    };

    assert.equal(result.available, true);
    assert.deepEqual(result.providers, ["unsplash"]);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.alt, "hair salon");
    assert.match(result.items[0]?.url ?? "", /unsplash/);
  });

  it("clamps count before calling the callback", async () => {
    let seenCount: number | undefined;

    await executeBuilderAITool(
      "searchStockImages",
      { query: "nails", count: 99 },
      {
        adapter: createAdapter(),
        document,
        selection,
        searchStockImages: async ({ count }) => {
          seenCount = count;
          return { available: true, providers: [], items: [] };
        },
      },
    );

    assert.equal(seenCount, 12);
  });
});
