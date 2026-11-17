import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TEditorBlock } from "@hacado/builder/editor";
import { createRegistryAdapter } from "../adapters";
import { executeBuilderAITool } from "../tools/executor";
import type { SelectionContextPayload } from "../types";
import * as z from "zod";

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

describe("searchPages and getConnectedApps tools", () => {
  it("returns unavailable when searchPages is not wired", async () => {
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
    assert.match(String(result.hint ?? ""), /not available/i);
  });

  it("delegates to the injected searchPages callback", async () => {
    const result = (await executeBuilderAITool(
      "searchPages",
      { query: "book", limit: 5 },
      {
        adapter: createAdapter(),
        document,
        selection,
        searchPages: async ({ query }) => ({
          available: true,
          items: [
            {
              id: "1",
              title: "Book",
              slug: "book",
              href: "/book",
              published: true,
            },
          ].filter((item) => item.slug.includes(query ?? "")),
          hint: "Prefer /book for booking CTAs",
        }),
      },
    )) as {
      available: boolean;
      items: Array<{ href: string }>;
    };

    assert.equal(result.available, true);
    assert.equal(result.items[0]?.href, "/book");
  });

  it("returns connected apps with metadata hints", async () => {
    const result = (await executeBuilderAITool(
      "getConnectedApps",
      {},
      {
        adapter: createAdapter(),
        document,
        selection,
        connectedApps: [
          {
            appId: "w1",
            appName: "waitlist",
            metadataKey: "waitlistAppId",
            blockTypesHint: ["BookingModern"],
          },
        ],
      },
    )) as {
      apps: Array<{ appId: string; metadataKey?: string }>;
      hint?: string;
    };

    assert.equal(result.apps.length, 1);
    assert.equal(result.apps[0]?.appId, "w1");
    assert.equal(result.apps[0]?.metadataKey, "waitlistAppId");
    assert.match(String(result.hint ?? ""), /metadataKey/i);
  });
});
