import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const YouTubeVideoPropsSchema = z.object({
  style: zStyles.optional().nullable(),
  props: z
    .object({
      youtubeUrl: z.string().optional().nullable(),
      autoplay: z.boolean().optional().nullable(),
      controls: z.boolean().optional().nullable(),
      loop: z.boolean().optional().nullable(),
      muted: z.boolean().optional().nullable(),
      showInfo: z.boolean().optional().nullable(),
      rel: z.boolean().optional().nullable(),
      modestbranding: z.boolean().optional().nullable(),
      start: z.number().optional().nullable(),
      end: z.number().optional().nullable(),
      privacy: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type YouTubeVideoProps = Prettify<
  z.infer<typeof YouTubeVideoPropsSchema>
>;
export type YouTubeVideoReaderProps = BaseReaderBlockProps<any> &
  YouTubeVideoProps;

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
