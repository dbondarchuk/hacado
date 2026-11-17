import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const overlayType = ["blur", "default"] as const;

export const LightboxPropsSchema = z.object({
  props: z
    .object({
      overlay: z
        .enum(overlayType)
        .describe("Backdrop style behind the lightbox"),
      showAltAsDescription: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Show image alt text as a caption below the slide"),
      navigation: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Show previous/next controls"),
      loop: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Wrap from last slide to first"),
      autoPlay: z.coerce
        .number<number>()
        .positive()
        .min(1)
        .max(30)
        .optional()
        .nullable()
        .describe("Seconds between automatic slide changes; omit to disable"),
      children: z
        .array(z.any())
        .describe("Image or media blocks shown as lightbox slides"),
    })
    .describe("Block configuration props"),
});

export type LightboxProps = Prettify<z.infer<typeof LightboxPropsSchema>>;
export type LightboxReaderProps = BaseReaderBlockProps<any> & LightboxProps;

export { LightboxPropsDefaults } from "./defaults";
