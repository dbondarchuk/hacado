import {
  catalogFromSchemas,
  createAdapterFromCatalog,
} from "@hacado/ai-builder-core";
import { PAGE_BLOCK_AI_CATALOG_META } from "@hacado/page-builder/blocks/ai-catalog-meta";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("page-builder AI catalog meta", () => {
  it("exposes text actions for Text without client EditorBlocks", async () => {
    const blocks = catalogFromSchemas({
      schemas: {
        Text: { parse: (value: unknown) => value } as never,
      },
      meta: PAGE_BLOCK_AI_CATALOG_META,
      providerName: "core",
    });

    const adapter = createAdapterFromCatalog({
      builder: "page",
      blocks,
    });

    const capabilities = await adapter.getBlockAICapabilities({
      blockType: "Text",
    });

    assert.ok(capabilities.some((capability) => capability.id === "rewrite"));
  });

  it("exposes layout actions for Container", async () => {
    const blocks = catalogFromSchemas({
      schemas: {
        Container: { parse: (value: unknown) => value } as never,
      },
      meta: PAGE_BLOCK_AI_CATALOG_META,
      providerName: "core",
    });

    const adapter = createAdapterFromCatalog({
      builder: "page",
      blocks,
    });

    const capabilities = await adapter.getBlockAICapabilities({
      blockType: "Container",
    });

    assert.ok(
      capabilities.some((capability) => capability.id === "improve_layout"),
    );
  });
});
