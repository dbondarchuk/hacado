import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const FormBlockPropsSchema = z.object({
  props: z
    .object({
      formId: z
        .string()
        .nullable()
        .optional()
        .describe("MongoDB ObjectId of the form to render in this block."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type FormBlockProps = Prettify<z.infer<typeof FormBlockPropsSchema>>;
export type FormBlockReaderProps = BaseReaderBlockProps<any> & FormBlockProps;

export { FormBlockPropsDefaults } from "./defaults";
