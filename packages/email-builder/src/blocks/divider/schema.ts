import * as z from "zod";
import {
  zColor,
  zColorNullable,
  zPadding,
} from "../../style-inputs/helpers/zod";

export const DividerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: zColorNullable.describe(
        "Background color of the area around the divider line.",
      ),
      padding: zPadding.describe("Padding around the divider block."),
    })
    .optional()
    .nullable()
    .describe("Surrounding background and padding for the divider."),
  props: z
    .object({
      lineColor: zColor.describe("Color of the horizontal divider line."),
      lineHeight: z.coerce
        .number<number>()
        .int("Should be the integer value")
        .positive()
        .optional()
        .nullable()
        .describe("Thickness of the divider line in pixels."),
    })
    .optional()
    .nullable()
    .describe("Divider line color and thickness."),
});

export type DividerProps = z.infer<typeof DividerPropsSchema>;

export { DividerPropsDefaults } from "./defaults";