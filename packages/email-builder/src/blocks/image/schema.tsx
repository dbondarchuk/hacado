import * as z from "zod";
import { zStylesBase } from "../../style-inputs/helpers/zod";

export const ImagePropsSchema = z.object({
  style: zStylesBase
    .pick({ padding: true, backgroundColor: true, textAlign: true })
    .optional()
    .nullable()
    .describe(
      "Optional email image styles (padding, backgroundColor, textAlign).",
    ),
  props: z
    .object({
      width: z
        .number()
        .positive("emailBuilder.blocks.image.validation.width")
        .optional()
        .nullable()
        .describe("Displayed image width in pixels"),
      height: z
        .number()
        .positive("emailBuilder.blocks.image.validation.height")
        .optional()
        .nullable()
        .describe("Displayed image height in pixels"),
      x: z
        .number()
        .min(0, "emailBuilder.blocks.image.validation.x")
        .max(100, "emailBuilder.blocks.image.validation.x")
        .optional()
        .nullable()
        .describe("Horizontal crop/focal point 0-100"),
      y: z
        .number()
        .min(0, "emailBuilder.blocks.image.validation.y")
        .max(100, "emailBuilder.blocks.image.validation.y")
        .optional()
        .nullable()
        .describe("Vertical crop/focal point 0-100"),
      url: z
        .string()
        .optional()
        .nullable()
        .describe("Image source URL; set this for the image to render."),
      alt: z.string().optional().nullable().describe("Accessible alt text"),
      linkHref: z
        .string()
        .optional()
        .nullable()
        .describe("Optional URL opened when the image is clicked"),
      contentAlignment: z
        .enum(["top", "middle", "bottom"])
        .optional()
        .nullable()
        .describe("Vertical alignment of the image in its cell"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type ImageProps = z.infer<typeof ImagePropsSchema>;

export { ImagePropsDefaults } from "./defaults";
