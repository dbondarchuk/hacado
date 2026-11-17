import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const ImagePropsSchema = z.object({
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
        .describe("Image source URL; set this for the image to render."),
      alt: z
        .string()
        .optional()
        .nullable()
        .describe("Accessible alt text; use for SEO and screen readers."),
      linkHref: z
        .string()
        .optional()
        .nullable()
        .describe("Optional URL opened when the image is clicked."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type ImageProps = Prettify<z.infer<typeof ImagePropsSchema>>;
export type ImageReaderProps = BaseReaderBlockProps<any> & ImageProps;

export { ImagePropsDefaults } from "./defaults";
