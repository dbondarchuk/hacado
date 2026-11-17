import {
  normalizePlateBodyValue,
  type PlateEditorValue,
} from "@hacado/rte/plate-value";

/**
 * Email Text blocks store Plate rich-text nodes in `props.value`.
 * AI / defaults may provide markdown, plain string, or aliased node types.
 */
export function coerceEmailTextValue(value: unknown): PlateEditorValue {
  return normalizePlateBodyValue(value);
}
