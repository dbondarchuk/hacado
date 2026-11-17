import type { VideoProps } from "./schema";

export const VideoPropsDefaults = {
  props: {
    src: "/assets/placeholder/video.mp4",
    poster: null,
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
    preload: "metadata",
  },
  style: {
    textAlign: [
      {
        value: "center",
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
  },
} as const satisfies VideoProps;
