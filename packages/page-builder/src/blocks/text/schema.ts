import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { plateBodyValueSchema } from "@hacado/rte/plate-value";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const TextPropsSchema = z.object({
  props: z
    .object({
      value: plateBodyValueSchema.describe(
        "Rich text body (Plate editor document value)",
      ),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type TextProps = Prettify<z.infer<typeof TextPropsSchema>>;
export type TextReaderProps = BaseReaderBlockProps<any> & TextProps;

export { TextPropsDefaults } from "./defaults";