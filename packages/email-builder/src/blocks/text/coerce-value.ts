import { normalizePlateBodyValue } from "@hacado/rte/plate-value";

/**
 * Email Text blocks store Plate rich-text nodes in `props.value`.
 * AI / defaults may provide markdown, plain string, or aliased node types.
 */
export function coerceEmailTextValue(value: unknown): unknown[] {
  const normalized = normalizePlateBodyValue(value);

  return Array.isArray(normalized)
    ? normalized
    : [{ type: "p", children: [{ text: "" }] }];
}
