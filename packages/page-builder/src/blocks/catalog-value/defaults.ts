import type { CatalogValueProps } from "./schema";

export const CatalogValuePropsDefaults = {
  props: {
    source: "service",
    itemId: null,
    property: "name",
    stripFormatting: false,
    alwaysShowCents: false,
    showCurrency: false,
    durationFormat: "hoursMinutes",
    durationStyle: "medium",
  },
  style: {},
} as const satisfies CatalogValueProps;
