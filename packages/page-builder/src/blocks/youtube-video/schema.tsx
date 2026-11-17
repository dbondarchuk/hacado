import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const YouTubeVideoPropsSchema = z.object({
  style: zStyles
    .optional()
    .nullable()
    .describe(
      "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
    ),
  props: z
    .object({
      youtubeUrl: z
        .string()
        .optional()
        .nullable()
        .describe("Full YouTube watch or embed URL for the video."),
      autoplay: z
        .boolean()
        .optional()
        .nullable()
        .describe("Start playback automatically when the player loads."),
      controls: z
        .boolean()
        .optional()
        .nullable()
        .describe("Show the player control bar."),
      loop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Replay the video when it ends."),
      muted: z
        .boolean()
        .optional()
        .nullable()
        .describe("Start with audio muted (often required for autoplay)."),
      showInfo: z
        .boolean()
        .optional()
        .nullable()
        .describe("Show the video title and uploader before playback."),
      rel: z
        .boolean()
        .optional()
        .nullable()
        .describe("Show related videos from other channels at the end."),
      modestbranding: z
        .boolean()
        .optional()
        .nullable()
        .describe("Use a minimal YouTube logo in the control bar."),
      start: z
        .number()
        .optional()
        .nullable()
        .describe("Start playback at this time in seconds."),
      end: z
        .number()
        .optional()
        .nullable()
        .describe("Stop playback at this time in seconds."),
      privacy: z
        .boolean()
        .optional()
        .nullable()
        .describe("Use the privacy-enhanced youtube-nocookie embed host."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type YouTubeVideoProps = Prettify<
  z.infer<typeof YouTubeVideoPropsSchema>
>;

export type YouTubeVideoReaderProps = BaseReaderBlockProps<any> &
  YouTubeVideoProps;

export { YouTubeVideoPropsDefaults } from "./defaults";
