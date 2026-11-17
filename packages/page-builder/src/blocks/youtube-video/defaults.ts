import type { YouTubeVideoProps } from "./schema";

export const YouTubeVideoPropsDefaults = {
  props: {
    youtubeUrl: "",
    autoplay: false,
    controls: true,
    loop: false,
    muted: false,
    showInfo: true,
    rel: false,
    modestbranding: false,
    start: null,
    end: null,
    privacy: false,
  },
  style: {
    textAlign: [
      {
        value: "center",
      },
    ],
    width: [
      {
        value: {
          value: 100,
          unit: "%",
        },
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
    padding: [
      {
        value: {
          left: {
            value: 0,
            unit: "px",
          },
          right: {
            value: 0,
            unit: "px",
          },
          top: {
            value: 0,
            unit: "px",
          },
          bottom: {
            value: 56.25,
            unit: "vh",
          },
        },
      },
    ],

    display: [
      {
        value: "inline-block",
      },
    ],
  },
} as const satisfies YouTubeVideoProps;
