/**
 * Email Text blocks store Plate rich-text nodes in `props.value`.
 * AI / defaults sometimes provide a plain string — coerce so static preview
 * and unselected editor state still render.
 */
export function coerceEmailTextValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return [{ type: "p", children: [{ text: value }] }];
  }

  return [{ type: "p", children: [{ text: "" }] }];
}
