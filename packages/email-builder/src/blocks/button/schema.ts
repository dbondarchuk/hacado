import * as z from "zod";
import { EMAIL_BRAND } from "../../brand";
import { zColorNullable, zStyles } from "../../style-inputs/helpers/zod";

export const ButtonPropsSchema = z.object({
  style: zStyles.describe(
    "Typography, colors, spacing, and alignment around the button.",
  ),
  props: z
    .object({
      buttonBackgroundColor: zColorNullable.describe(
        "Fill color behind the button label.",
      ),
      buttonStyle: z
        .enum(["rectangle", "pill", "rounded"])
        .optional()
        .nullable()
        .describe("Corner style of the button shape."),
      buttonTextColor: zColorNullable.describe("Color of the button label text."),
      width: z
        .enum(["auto", "full"])
        .optional()
        .nullable()
        .describe("Whether the button shrinks to content or spans full width."),
      size: z
        .enum(["x-small", "small", "large", "medium"])
        .optional()
        .nullable()
        .describe("Preset padding and font size for the button."),
      text: z.string().min(1).describe("Visible label on the button."),
      url: z
        .string()
        .optional()
        .nullable()
        .describe("Link URL opened when the button is clicked."),
    })
    .optional()
    .nullable()
    .describe("Button label, link, and visual settings."),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

export { ButtonPropsDefaults } from "./defaults";