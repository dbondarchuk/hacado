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

describe("legacy searchStockImages stub", () => {
  it("points at platform_searchStockImages", async () => {
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
      items: unknown[];
      hint?: string;
    };

    assert.equal(result.available, false);
    assert.deepEqual(result.items, []);
    assert.match(String(result.hint ?? ""), /platform_searchStockImages/i);
  });
});
