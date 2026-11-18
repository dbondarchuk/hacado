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
        type: "Button",
        displayName: "Button",
        category: "content",
        schema: z.object({ props: z.object({ href: z.string() }) }),
        providerName: "core",
      },
    ],
  });
}

describe("legacy executor stubs for moved platform tools", () => {
  it("searchPages points at platform_searchPages", async () => {
    const result = (await executeBuilderAITool(
      "searchPages",
      { query: "book" },
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
    assert.match(String(result.hint ?? ""), /platform_searchPages/i);
  });

  it("getConnectedApps points at platform_listConnectedApps", async () => {
    const result = (await executeBuilderAITool(
      "getConnectedApps",
      {},
      {
        adapter: createAdapter(),
        document,
        selection,
      },
    )) as {
      apps: unknown[];
      hint?: string;
    };

    assert.deepEqual(result.apps, []);
    assert.match(String(result.hint ?? ""), /platform_listConnectedApps/i);
  });
});
