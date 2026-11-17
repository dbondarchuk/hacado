import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const HeadingPropsSchema = z.object({
  props: z
    .object({
      children: z
        .array(z.any())
        .describe(
          'Inline children only (capability "inline"): typically InlineContainer → InlineText. Never nest Text/Container/Image here - copy defaultValue shape.',
        ),
      level: z
        .enum(["h1", "h2", "h3", "h4", "h5", "h6"])
        .optional()
        .nullable()
        .describe("Semantic heading level (h1-h6)"),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type HeadingProps = Prettify<z.infer<typeof HeadingPropsSchema>>;
export type HeadingReaderProps = BaseReaderBlockProps<any> & HeadingProps;

export const DefaultHeadingLevel = "h2";

export { HeadingPropsDefaults } from "./defaults";
