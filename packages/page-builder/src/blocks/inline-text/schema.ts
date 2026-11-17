import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const InlineTextPropsSchema = z.object({
  props: z
    .object({
      text: z
        .any()
        .optional()
        .nullable()
        .describe("Plain or rich inline text content"),
      // url: z.string().optional().nullable(),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type InlineTextProps = Prettify<z.infer<typeof InlineTextPropsSchema>>;
export type InlineTextReaderProps = BaseReaderBlockProps<any> & InlineTextProps;

export { InlineTextPropsDefaults } from "./defaults";