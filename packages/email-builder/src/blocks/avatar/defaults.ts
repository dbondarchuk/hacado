import type { AvatarProps } from "./schema";

export const AvatarPropsDefaults = {
  props: {
    size: 64,
    imageUrl: "https://ui-avatars.com/api/?size=128",
    alt: "",
    shape: "circle",
  },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    textAlign: "left",
  },
} as const satisfies AvatarProps;
