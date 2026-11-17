import type { LightboxProps } from "./schema";

export const LightboxPropsDefaults = {
  props: {
    overlay: "default",
    showAltAsDescription: true,
    navigation: true,
    loop: true,
    autoPlay: null,
    children: [],
  },
} as const satisfies LightboxProps;
