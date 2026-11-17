import {
  zodSchemaToJson,
  type DesignTokenHit,
  type StyleCatalogEntry,
} from "@hacado/ai-builder-core";
import {
  allStyles,
  breakpoints,
  COLORS_LIST,
  states,
} from "@hacado/page-builder-base/style";
import { FONT_FAMILIES } from "@hacado/page-builder-base/style-inputs";

const breakpointHint = `Responsive tokens (${breakpoints.join(", ")}). Always an array of tokens — never a bare string like "mobile".`;

/** Wrap a style value schema as the variant array the editor expects. */
function styleVariantsSchema(valueSchema: unknown, name: string) {
  const valueJson = zodSchemaToJson(
    valueSchema as never,
    `page-style-value:${name}`,
  );

  return {
    type: "array",
    description: `Variant list for ${name}. Prefer [{ value }] with no breakpoint; when responsive, set breakpoint to an array of tokens.`,
    items: {
      type: "object",
      required: ["value"],
      properties: {
        value: valueJson,
        breakpoint: {
          type: "array",
          items: { type: "string", enum: [...breakpoints] },
          description: breakpointHint,
        },
        state: {
          type: "array",
          items: {
            type: "object",
            required: ["state"],
            properties: {
              state: { type: "string", enum: [...states] },
              target: {
                type: "object",
                description: "Optional state target (self/parent/selector).",
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
  };
}

/** Style property catalog with AI-facing JSON schemas (not inlined into getBlockSchemas). */
export function styleCatalogFromPageBuilder(): StyleCatalogEntry[] {
  return allStyles.map((style) => ({
    name: String(style.name),
    category: style.category ? String(style.category) : undefined,
    description:
      typeof style.description === "string" && style.description.length > 0
        ? style.description
        : undefined,
    schema: styleVariantsSchema(style.schema, String(style.name)),
  }));
}

/** Allowed color/font token values for branding-aware styling. */
export function designTokensFromPageBuilder(): DesignTokenHit[] {
  const colors: DesignTokenHit[] = COLORS_LIST.map((entry) => ({
    name: entry.key,
    category: "color",
    value: entry.value,
  }));

  const fonts: DesignTokenHit[] = Object.keys(FONT_FAMILIES).map((name) => ({
    name,
    category: "font",
    // Style values use the token key (PRIMARY), not the CSS stack.
    value: name,
  }));

  return [...colors, ...fonts];
}
