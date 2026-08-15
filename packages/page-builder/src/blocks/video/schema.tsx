import { BaseReaderBlockProps } from "@hacado/builder";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const VideoPropsSchema = z.object({
  style: zStyles.optional().nullable(),
  props: z
    .object({
      src: z.string().optional().nullable(),
      poster: z.string().optional().nullable(),
      controls: z.boolean().optional().nullable(),
      autoplay: z.boolean().optional().nullable(),
      loop: z.boolean().optional().nullable(),
      muted: z.boolean().optional().nullable(),
      preload: z.enum(["none", "metadata", "auto"]).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type VideoProps = Prettify<z.infer<typeof VideoPropsSchema>>;
export type VideoReaderProps = BaseReaderBlockProps<any> & VideoProps;

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
