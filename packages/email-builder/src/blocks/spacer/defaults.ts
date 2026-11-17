import type { SpacerProps } from "./schema";

export const SpacerPropsDefaults = {
  props: { height: 16 },
} as const satisfies SpacerProps;
