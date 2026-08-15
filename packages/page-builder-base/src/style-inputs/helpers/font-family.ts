import { AllKeys } from "@hacado/i18n";
import { ValueLabel } from "../../style/helpers/types";

export const FONT_FAMILY_NAMES = [
  "INHERIT",
  "PRIMARY",
  "SECONDARY",
  "TERTIARY",
  "MODERN_SANS",
  "BOOK_SANS",
  "ORGANIC_SANS",
  "GEOMETRIC_SANS",
  "HEAVY_SANS",
  "ROUNDED_SANS",
  "MODERN_SERIF",
  "BOOK_SERIF",
  "MONOSPACE",
] as const;

export const FONT_FAMILIES: Record<
  (typeof FONT_FAMILY_NAMES)[number],
  ValueLabel
> = {
  INHERIT: {
    label: "builder.pageBuilder.styles.fontFamily.inherit",
    value: "inherit",
  },
  PRIMARY: {
    label: "builder.pageBuilder.styles.fontFamily.primary",
    value: "var(--font-primary-value)",
  },
  SECONDARY: {
    label: "builder.pageBuilder.styles.fontFamily.secondary",
    value: "var(--font-secondary-value)",
  },
  TERTIARY: {
    label: "builder.pageBuilder.styles.fontFamily.tertiary",
    value: "var(--font-tertiary-value)",
  },
  MODERN_SANS: {
    label: "Modern sans",
    value: '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif',
  },
  BOOK_SANS: {
    label: "Book sans",
    value: 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif',
  },
  ORGANIC_SANS: {
    label: "Organic sans",
    value:
      'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
  },
  GEOMETRIC_SANS: {
    label: "Geometric sans",
    value:
      'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
  },
  HEAVY_SANS: {
    label: "Heavy sans",
    value:
      'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif',
  },
  ROUNDED_SANS: {
    label: "Rounded sans",
    value:
      'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
  },
  MODERN_SERIF: {
    label: "Modern serif",
    value: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  },
  BOOK_SERIF: {
    label: "Book serif",
    value:
      '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
  },
  MONOSPACE: {
    label: "Monospace",
    value: '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace',
  },
};

export const FONT_FAMILIES_LIST = Object.entries(FONT_FAMILIES).map(
  ([key, value]) => ({
    key,
    ...value,
  }),
) as {
  key: (typeof FONT_FAMILY_NAMES)[number];
  label: AllKeys | string;
  value: string;
}[];
