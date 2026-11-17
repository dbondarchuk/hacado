import type { ImageProps } from "./schema";

export const ImagePropsDefaults = {
  props: {
    src: "/assets/placeholder/400x200.jpg",
    alt: "Sample image",
    linkHref: null,
  },
  style: {
    textAlign: [
      {
        value: "center",
      },
    ],
    objectFit: [
      {
        value: "cover",
      },
    ],
    objectPosition: [
      {
        value: { x: 50, y: 50 },
      },
    ],
    verticalAlign: [
      {
        value: "middle",
      },
    ],
    maxWidth: [
      {
        value: {
          value: 100,
          unit: "%",
        },
      },
    ],
    display: [
      {
        value: "inline-block",
      },
    ],
    textDecoration: [
      {
        value: "none",
      },
    ],
  },
} as const satisfies ImageProps;
