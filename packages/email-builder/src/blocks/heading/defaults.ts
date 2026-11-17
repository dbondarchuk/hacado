import type { HeadingProps } from "./schema";

export const HeadingPropsDefaults = {
  props: {
    level: "h2",
    text: "Hello friend",
  },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    textAlign: "center",
    fontWeight: "bold",
  },
} as const satisfies HeadingProps;
