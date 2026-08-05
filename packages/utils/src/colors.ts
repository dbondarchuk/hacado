import { StylingConfiguration } from "@hacado/types";
import Color from "color";

export const getColorsCss = (
  colors?: StylingConfiguration["colors"],
  prefix?: string,
  replaceOriginal?: boolean,
) => {
  return (colors || [])
    .filter((color) => !!color.value)
    .map(({ type, value }) => {
      if (value?.startsWith("#")) {
        const color = Color(value).hsl().object();
        return `--${prefix ? `${prefix}-` : ""}${type}-color: ${color.h.toFixed(1)} ${color.s.toFixed(1)}% ${color.l.toFixed(1)}%;`;
      }

      return `--${prefix ? `${prefix}-` : ""}${type}${!replaceOriginal ? "-color" : ""}: ${value};`;
    })
    .join("\n");
};

const PREBUILT_COLORS = [
  // Blues
  "#1D4ED8",
  "#2563EB",
  "#1E40AF",
  "#1E3A8A",
  "#3B82F6",
  "#2563EB",
  "#1D4ED8",
  "#1E429F",

  // Sky
  "#0369A1",
  "#0284C7",
  "#0891B2",
  "#0EA5E9",
  "#155E75",
  "#164E63",
  "#0E7490",
  "#075985",

  // Teal
  "#0F766E",
  "#0D9488",
  "#115E59",
  "#134E4A",
  "#0F766E",
  "#047857",
  "#006D77",
  "#005F73",

  // Emerald
  "#166534",
  "#15803D",
  "#16A34A",
  "#14532D",
  "#2E7D32",
  "#2D6A4F",
  "#3A5A40",
  "#386641",

  // Indigo
  "#4338CA",
  "#4F46E5",
  "#3730A3",
  "#312E81",
  "#5B21B6",
  "#6366F1",
  "#5C6BC0",
  "#3949AB",

  // Purple
  "#6D28D9",
  "#7C3AED",
  "#7E22CE",
  "#9333EA",
  "#6B21A8",
  "#581C87",
  "#5A189A",
  "#6930C3",

  // Blue Grey
  "#334155",
  "#475569",
  "#1E293B",
  "#374151",
  "#455A64",
  "#546E7A",
  "#3F4C6B",
  "#264653",

  // Ocean
  "#003049",
  "#1B4965",
  "#22577A",
  "#2C5282",
  "#355070",
  "#1A535C",
  "#184E77",
  "#0B3C5D",
] as const;

export const getColorForName = (name: string): string => {
  const normalized = name.trim().toLowerCase();

  // FNV-1a
  let hash = 2166136261;

  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return PREBUILT_COLORS[(hash >>> 0) % PREBUILT_COLORS.length];
};

const DESTRUCTIVE_ROSE = "#e11d48";
const PENDING_AMBER = "#f59e0b";

export type CalendarEventColorStatus = "confirmed" | "pending" | "declined";

export type CalendarEventColorStyles = {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderLeftColor?: string;
};

function softEventTint(base: ReturnType<typeof Color>): CalendarEventColorStyles {
  const background = Color("#ffffff").mix(base, 0.18).alpha(0.9);
  const text = base.darken(0.35).saturate(0.1);
  const border = Color("#ffffff").mix(base, 0.4);

  return {
    backgroundColor: background.rgb().string(),
    color: text.hex(),
    borderColor: border.rgb().string(),
  };
}

/**
 * Inline styles for member-colored calendar events.
 * Declined mixes the member color with destructive rose.
 */
export const getCalendarEventColorStyles = (
  hex: string,
  status: CalendarEventColorStatus,
): CalendarEventColorStyles => {
  const base =
    status === "declined"
      ? Color(hex).mix(Color(DESTRUCTIVE_ROSE), 0.55)
      : Color(hex);

  const tint = softEventTint(base);

  if (status === "pending") {
    return {
      ...tint,
      borderLeftColor: PENDING_AMBER,
    };
  }

  if (status === "declined") {
    return {
      ...tint,
      borderLeftColor: DESTRUCTIVE_ROSE,
    };
  }

  return tint;
};
