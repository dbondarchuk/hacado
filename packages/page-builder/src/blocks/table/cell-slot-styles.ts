const TABLE_CELL_INNER_STYLE_KEYS = [
  "display",
  "flexDirection",
  "alignContent",
  "justifyContent",
  "alignItems",
  "gap",
] as const;

/** Keep table layout: never apply flex axis on the `<td>` surface. */
export function tableCellSlotStylesForSurface(
  style: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!style) return {};

  const { display: _d, flexDirection: _f, ...rest } = style;
  return rest;
}

export function splitTableCellSlotStyles(
  style: Record<string, unknown> | undefined,
): {
  surface: Record<string, unknown>;
  inner: Record<string, unknown>;
} {
  if (!style) return { surface: {}, inner: {} };

  const surface = { ...style };
  const inner: Record<string, unknown> = {};

  for (const key of TABLE_CELL_INNER_STYLE_KEYS) {
    if (key in surface) {
      inner[key] = surface[key];
      delete surface[key];
    }
  }

  return {
    surface: tableCellSlotStylesForSurface(surface),
    inner,
  };
}

export function tableCellInnerClassName(slotId: string) {
  return `pb-slot-${slotId}-inner`;
}
