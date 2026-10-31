import * as z from "zod";

export const colors = [
  "background",
  "foreground",
  "border",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
] as const;

export const colorsLabels: Record<(typeof colors)[number], string> = {
  background: "Background",
  foreground: "Text",
  border: "Border",
  card: "Card",
  "card-foreground": "Card text",
  popover: "Popover",
  "popover-foreground": "Popover text",
  primary: "Primary",
  "primary-foreground": "Primary text",
  secondary: "Secondary",
  "secondary-foreground": "Secondary text",
  muted: "Muted",
  "muted-foreground": "Muted text",
  accent: "Accent",
  "accent-foreground": "Accent text",
  destructive: "Destructive",
  "destructive-foreground": "Destructive text",
};

export const colorsEnum = z.enum(colors, {
  error: "configuration.styling.colors.invalid",
});

export const themeColorPresets = [
  "var(--value-background-color)",
  "var(--value-foreground-color)",
  "var(--value-border-color)",
  "var(--value-card-color)",
  "var(--value-card-foreground-color)",
  "var(--value-popover-color)",
  "var(--value-popover-foreground-color)",
  "var(--value-primary-color)",
  "var(--value-primary-foreground-color)",
  "var(--value-secondary-color)",
  "var(--value-secondary-foreground-color)",
  "var(--value-muted-color)",
  "var(--value-muted-foreground-color)",
  "var(--value-accent-color)",
  "var(--value-accent-foreground-color)",
  "var(--value-destructive-color)",
  "var(--value-destructive-foreground-color)",
] as const satisfies readonly `var(--value-${(typeof colors)[number]}-color)`[];

/** Custom HSL `"H S% L%"`. */
export const zThemeColorCustom = z
  .string()
  .regex(/^(\d+)\s+([\d.]+)%\s+([\d.]+)%$/);

/** System theme color CSS var. */
export const zThemeColorPreset = z.enum(themeColorPresets);

/** System color or custom HSL (no transparent). */
export const zThemeColor = z.union([zThemeColorCustom, zThemeColorPreset]);

/** System color, transparent, or custom HSL. */
export const zThemeColorWithTransparent = z.union([
  zThemeColorCustom,
  zThemeColorPreset,
  z.literal("transparent"),
]);

export const zThemeColorWithCurrentColor = z.union([
  zThemeColorCustom,
  zThemeColorPreset,
  z.literal("currentColor"),
]);

export const zThemeColorWithTransparentAndCurrentColor = z.union([
  zThemeColorCustom,
  zThemeColorPreset,
  z.literal("currentColor"),
  z.literal("transparent"),
]);

export const colorOverrideSchema = z.object({
  type: colorsEnum,
  value: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    error: "configuration.styling.colors.value.invalid",
  }),
});

export type ColorOverrideSchema = z.infer<typeof colorOverrideSchema>;
