import type { ImageProps } from "./schema";

export const ImagePropsDefaults = {
  props: {
    url: "/assets/placeholder/400x200.jpg",
    alt: "Sample image",
    contentAlignment: "middle",
    linkHref: null,
    x: 50,
    y: 50,
  },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    textAlign: "center",
  },
} as const satisfies ImageProps;
