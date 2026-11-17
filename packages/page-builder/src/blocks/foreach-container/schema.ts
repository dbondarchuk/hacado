import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { asOptinalNumberField, asOptionalField } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const ForeachContainerPropsSchema = z.object({
  props: z
    .object({
      value: z
        .string()
        .min(1, "pageBuilder.blocks.foreachContainer.errors.value")
        .describe(
          "Binding expression resolving to an array to iterate (e.g. catalog list)",
        ),
      itemName: asOptionalField(
        z
          .string()
          .regex(
            /^[a-zA-Z_$][a-zA-Z_$0-9]*$/,
            "pageBuilder.blocks.foreachContainer.errors.itemName",
          ),
      ).describe("Variable name for each item inside the loop body"),
      skip: asOptinalNumberField(
        z
          .number()
          .int()
          .min(0, "pageBuilder.blocks.foreachContainer.errors.skip"),
      ).describe("Number of leading items to skip"),
      take: asOptinalNumberField(
        z
          .number()
          .int()
          .min(0, "pageBuilder.blocks.foreachContainer.errors.take"),
      ).describe("Maximum number of items to render after skip"),
      children: z
        .array(z.any())
        .describe("Child blocks repeated once per array item"),
    })
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
});

export type ForeachContainerProps = z.infer<typeof ForeachContainerPropsSchema>;
export type ForeachContainerReaderProps = BaseReaderBlockProps<any> &
  ForeachContainerProps;

export { ForeachContainerPropsDefaults } from "./defaults";
