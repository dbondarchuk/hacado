import { createAdapterFromCatalog } from "@hacado/ai-builder-core";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  designTokensFromPageBuilder,
  styleCatalogFromPageBuilder,
} from "../style-catalog";

describe("page-builder style catalog for AI", () => {
  it("attaches real JSON schemas (not unknown) for style properties", async () => {
    const styles = styleCatalogFromPageBuilder();
    const fontFamily = styles.find((style) => style.name === "fontFamily");

    assert.ok(fontFamily);
    assert.ok(fontFamily.schema);
    assert.notEqual((fontFamily.schema as { type?: string }).type, "unknown");

    const adapter = createAdapterFromCatalog({
      builder: "page",
      blocks: [],
      styles,
      designTokens: [],
    });

    const schemas = await adapter.getStyleSchema({
      properties: ["fontFamily", "padding"],
    });

    assert.equal(schemas.length, 2);

    for (const entry of schemas) {
      assert.ok(entry.schema);
      assert.notEqual((entry.schema as { type?: string }).type, "unknown");

      const schemaText = JSON.stringify(entry.schema);

      assert.match(schemaText, /breakpoint/);
      assert.match(schemaText, /max-md/);
    }
  });

  it("exposes non-empty color and font design tokens", async () => {
    const tokens = designTokensFromPageBuilder();
    const colors = tokens.filter((token) => token.category === "color");
    const fonts = tokens.filter((token) => token.category === "font");

    assert.ok(colors.length > 0);
    assert.ok(fonts.length > 0);
    assert.ok(fonts.some((token) => token.name === "PRIMARY"));
    assert.ok(
      colors.some(
        (token) =>
          typeof token.value === "string" &&
          token.value.startsWith("var(--value-") &&
          token.value.endsWith("-color)"),
      ),
    );

    const adapter = createAdapterFromCatalog({
      builder: "page",
      blocks: [],
      styles: [],
      designTokens: tokens,
    });

    const all = await adapter.getDesignTokens();
    const colorOnly = await adapter.getDesignTokens({
      categories: ["color"],
    });

    const fontOnly = await adapter.getDesignTokens({ categories: ["font"] });

    assert.ok(all.length > 0);
    assert.ok(colorOnly.every((token) => token.category === "color"));
    assert.ok(fontOnly.every((token) => token.category === "font"));
    assert.ok(fontOnly.some((token) => token.value === "PRIMARY"));
  });
});
