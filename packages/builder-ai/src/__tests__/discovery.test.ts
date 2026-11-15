import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as z from "zod";
import { createRegistryAdapter } from "../adapters";
import { searchBlockCatalog } from "../discovery/search";

const textSchema = z.object({
  props: z.object({
    text: z.string(),
  }),
});

const imageSchema = z.object({
  props: z.object({
    src: z.string(),
    alt: z.string().optional(),
  }),
});

describe("block discovery", () => {
  const blocks = [
    {
      type: "Text",
      displayName: "Text",
      category: "content",
      tags: ["text"],
      schema: textSchema,
      providerName: "core",
    },
    {
      type: "BlogPostList",
      displayName: "Blog posts",
      category: "apps",
      tags: ["blog"],
      schema: z.object({ props: z.object({}).passthrough() }),
      providerName: "blog",
      allowedBuilderTypes: ["page"],
    },
    {
      type: "Image",
      displayName: "Image",
      category: "media",
      tags: ["image"],
      schema: imageSchema,
      providerName: "core",
      allowedBuilderTypes: ["page", "footer"],
    },
  ];

  it("searches core and app blocks with provenance", () => {
    const hits = searchBlockCatalog(blocks, { query: "blog" });
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.type, "BlogPostList");
    assert.equal(hits[0]?.providerName, "blog");
  });

  it("filters footer adapter to allowed builder types", async () => {
    const adapter = createRegistryAdapter({
      builder: "footer",
      blocks,
    });
    const hits = await adapter.searchBlocks({ query: "blog" });
    assert.equal(hits.length, 0);

    const imageHits = await adapter.searchBlocks({ query: "image" });
    assert.equal(imageHits[0]?.type, "Image");
  });

  it("returns schemas only for requested types", async () => {
    const adapter = createRegistryAdapter({
      builder: "page",
      blocks,
    });
    const schemas = await adapter.getBlockSchemas({
      blockTypes: ["Text", "Missing"],
    });
    assert.equal(schemas.length, 1);
    assert.equal(schemas[0]?.type, "Text");
  });
});
