/** Recover arrays corrupted by object spread (`{ ...array }`). */
export function coerceArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const o = value as Record<string, T> & { length?: number };
  if (typeof o.length === "number" && o.length >= 0) {
    return Array.from({ length: o.length }, (_, i) => o[i] as T);
  }

  const keys = Object.keys(o)
    .filter((k) => /^\d+$/.test(k))
    .map(Number)
    .sort((a, b) => a - b);

  if (keys.length === 0) return [];

  return keys.map((k) => o[String(k)] as T);
}
