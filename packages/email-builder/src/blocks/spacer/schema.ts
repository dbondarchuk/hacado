import * as z from "zod";
import { zColorNullable } from "../../style-inputs/helpers/zod";

export const SpacerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: zColorNullable.describe(
        "Optional background fill behind the spacer.",
      ),
    })
    .optional()
    .nullable()
    .describe("Optional background styling for the spacer block."),
  props: z
    .object({
      height: z
        .number()
        .gte(0, "emailBuilder.blocks.spacer.validation.height")
        .optional()
        .nullish()
        .describe("Vertical empty space height in pixels."),
    })
    .optional()
    .nullable()
    .describe("Spacer height settings."),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;

export { SpacerPropsDefaults } from "./defaults";
