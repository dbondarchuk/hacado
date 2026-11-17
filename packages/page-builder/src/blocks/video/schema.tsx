import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const VideoPropsSchema = z.object({
  style: zStyles
    .optional()
    .nullable()
    .describe(
      "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
    ),
  props: z
    .object({
      src: z
        .string()
        .optional()
        .nullable()
        .describe("Video file URL served to the HTML video element."),
      poster: z
        .string()
        .optional()
        .nullable()
        .describe("Thumbnail image URL shown before playback starts."),
      controls: z
        .boolean()
        .optional()
        .nullable()
        .describe("Show native play, volume, and timeline controls."),
      autoplay: z
        .boolean()
        .optional()
        .nullable()
        .describe("Start playback automatically when allowed by the browser."),
      loop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Restart the video when it reaches the end."),
      muted: z
        .boolean()
        .optional()
        .nullable()
        .describe("Start with audio muted."),
      preload: z
        .enum(["none", "metadata", "auto"])
        .optional()
        .nullable()
        .describe("How much of the file the browser may fetch before play."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type VideoProps = Prettify<z.infer<typeof VideoPropsSchema>>;
export type VideoReaderProps = BaseReaderBlockProps<any> & VideoProps;

export { VideoPropsDefaults } from "./defaults";