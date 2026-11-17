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

  it("stubs style schemas and keeps props like lockServiceId", async () => {
    const hugeStyle = z.object(
      Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [
          `styleProp${i}`,
          z.array(z.object({ value: z.string() })).optional(),
        ]),
      ),
    );

    const bookingSchema = z.object({
      style: hugeStyle,
      props: z.object({
        lockServiceId: z
          .string()
          .optional()
          .nullable()
          .describe(
            "Mongo ObjectId of a catalog service; locks the form to that service.",
          ),
        lockMemberId: z.string().optional().nullable(),
        hideTitle: z.boolean().optional(),
      }),
    });

    const adapter = createRegistryAdapter({
      builder: "page",
      blocks: [
        {
          type: "BookingModern",
          displayName: "Booking",
          category: "apps",
          schema: bookingSchema,
          providerName: "waitlist",
        },
      ],
      styles: [
        {
          name: "styleProp0",
          category: "spacing",
          description: "CSS padding-like style prop 0",
          schema: { type: "string" },
        },
        {
          name: "styleProp1",
          category: "spacing",
          description: "CSS padding-like style prop 1",
          schema: { type: "string" },
        },
        {
          name: "unrelatedStyle",
          category: "misc",
          description: "Not on this block",
          schema: { type: "string" },
        },
      ],
    });

    const [result] = await adapter.getBlockSchemas({
      blockTypes: ["BookingModern"],
    });

    const raw = JSON.stringify(result);

    assert.ok(result);
    assert.ok(raw.includes("lockServiceId"));
    assert.ok(raw.includes("locks the form to that service"));
    assert.ok(raw.length < 8_000);
    assert.deepEqual(result.supportedStyles?.slice(0, 2), [
      {
        name: "styleProp0",
        description: "CSS padding-like style prop 0",
        category: "spacing",
      },
      {
        name: "styleProp1",
        description: "CSS padding-like style prop 1",
        category: "spacing",
      },
    ]);

    assert.ok(
      result.supportedStyles?.some((style) => style.name === "styleProp39"),
    );

    const schema = result.schema as {
      properties?: {
        style?: { additionalProperties?: boolean; description?: string };
        props?: unknown;
      };
    };

    assert.equal(schema.properties?.style?.additionalProperties, true);
    assert.ok(
      schema.properties?.style?.description?.includes("supportedStyles"),
    );

    assert.equal(
      JSON.stringify(schema.properties?.style).includes("styleProp"),
      false,
    );

    const styleHits = await adapter.searchStyleProperties({
      query: "style",
      blockType: "BookingModern",
    });

    assert.ok(styleHits.every((hit) => hit.name.startsWith("styleProp")));
    assert.equal(
      styleHits.some((hit) => hit.name === "unrelatedStyle"),
      false,
    );

    assert.equal(
      styleHits.find((hit) => hit.name === "styleProp0")?.description,
      "CSS padding-like style prop 0",
    );

    const styleSchemas = await adapter.getStyleSchema({
      properties: ["styleProp0", "unrelatedStyle"],
      blockType: "BookingModern",
    });

    assert.equal(styleSchemas.length, 1);
    assert.equal(styleSchemas[0]?.name, "styleProp0");
    assert.equal(styleSchemas[0]?.description, "CSS padding-like style prop 0");
  });
});
