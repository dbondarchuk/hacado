const STORAGE_KEY = "hacado/rte-inline/recent-colors";
export const RECENT_COLOR_SLOTS = 2;

function isBrowser() {
  return typeof window !== "undefined";
}

/** Normalizes #RGB → #RRGGBB for stable storage and comparison. */
export function normalizeHexColor(color: string): string | null {
  const trimmed = color.trim();
  const short = /^#([0-9A-Fa-f]{3})$/.exec(trimmed);
  if (short) {
    const [, h] = short;
    return `#${h![0]}${h![0]}${h![1]}${h![1]}${h![2]}${h![2]}`.toLowerCase();
  }
  const long = /^#([0-9A-Fa-f]{6})$/.exec(trimmed);
  if (long) return `#${long[1]!.toLowerCase()}`;
  return null;
}

export function isCustomHexColor(color: string): boolean {
  return normalizeHexColor(color) !== null;
}

export function readRecentColors(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((c) => (typeof c === "string" ? normalizeHexColor(c) : null))
      .filter((c): c is string => Boolean(c))
      .slice(0, RECENT_COLOR_SLOTS);
  } catch {
    return [];
  }
}

/** Saves a custom hex color; returns the updated list (newest first). */
export function rememberRecentColor(color: string): string[] {
  const normalized = normalizeHexColor(color);
  if (!normalized || !isBrowser()) return readRecentColors();

  const prev = readRecentColors().filter((c) => c !== normalized);
  const next = [normalized, ...prev].slice(0, RECENT_COLOR_SLOTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
  return next;
}
