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
        schema: z.object({
          props: z.object({
            src: z.string(),
          }),
        }),
        providerName: "core",
      },
    ],
  });
}

describe("legacy searchStockVideos stub", () => {
  it("points at platform_searchStockVideos", async () => {
    const result = (await executeBuilderAITool(
      "searchStockVideos",
      { query: "yoga studio", count: 3 },
      {
        adapter: createAdapter(),
        document,
        selection,
      },
    )) as {
      available: boolean;
      items: unknown[];
      hint?: string;
    };

    assert.equal(result.available, false);
    assert.deepEqual(result.items, []);
    assert.match(String(result.hint ?? ""), /platform_searchStockVideos/i);
  });
});
