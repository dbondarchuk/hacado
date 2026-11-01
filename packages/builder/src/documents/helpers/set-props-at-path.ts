import { coerceArray } from "./coerce-array";

/**
 * Immutable update at a dot path under block props.
 * Preserves arrays (never spreads them into plain objects).
 */
export function setPropsAtPath(
  props: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return props;

  function recurse(current: unknown, depth: number): unknown {
    if (depth >= segments.length) return value;

    const seg = segments[depth]!;
    const isNumeric = /^\d+$/.test(seg);

    if (Array.isArray(current) && isNumeric) {
      const idx = Number(seg);
      const copy = [...current];
      copy[idx] = recurse(copy[idx], depth + 1);
      return copy;
    }

    if (current && typeof current === "object" && !Array.isArray(current)) {
      const obj = current as Record<string, unknown>;
      const child = obj[seg];
      const nextChild =
        isNumeric && child && !Array.isArray(child)
          ? recurse(coerceArray(child), depth + 1)
          : recurse(child, depth + 1);

      return { ...obj, [seg]: nextChild };
    }

    if (isNumeric) {
      const idx = Number(seg);
      const arr = coerceArray<unknown>(current);
      const copy = [...arr];
      while (copy.length <= idx) copy.push({});
      copy[idx] = recurse(copy[idx], depth + 1);
      return copy;
    }

    return { [seg]: recurse(undefined, depth + 1) };
  }

  const top = segments[0]!;
  return {
    ...props,
    [top]: recurse(props[top], 1),
  };
}
