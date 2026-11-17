import { plateBodyValueSchema } from "@hacado/rte/plate-value";
import * as z from "zod";
import { zStyles } from "../../style-inputs/helpers/zod";

export const TextPropsSchema = z.object({
  style: zStyles.describe(
    "Typography, colors, spacing, and alignment for the text block.",
  ),
  props: z
    .object({
      value: plateBodyValueSchema.describe(
        "Rich text body (markdown preferred, or Plate nodes).",
      ),
    })
    .optional()
    .nullable()
    .describe("Text block content settings."),
});

export type TextProps = z.infer<typeof TextPropsSchema>;

export { TextPropsDefaults } from "./defaults";
