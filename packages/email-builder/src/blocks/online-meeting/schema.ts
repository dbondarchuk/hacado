import * as z from "zod";
import {
  zColorNullable,
  zFontFamily,
  zPadding,
} from "../../style-inputs/helpers/zod";

export const OnlineMeetingPropsSchema = z.object({
  props: z
    .object({
      title: z
        .string()
        .optional()
        .nullable()
        .describe("Meeting title shown in the block header."),
      whenText: z
        .string()
        .optional()
        .nullable()
        .describe("Human-readable date and time of the meeting."),
      codeText: z
        .string()
        .optional()
        .nullable()
        .describe("Meeting ID or dial-in code to display."),
      passwordText: z
        .string()
        .optional()
        .nullable()
        .describe("Meeting passcode or password to display."),
      buttonText: z
        .string()
        .optional()
        .nullable()
        .describe("Label on the primary join-meeting button."),
      linkText: z
        .string()
        .optional()
        .nullable()
        .describe("Alternate link text when shown as a text link."),
      buttonTextColor: zColorNullable.describe(
        "Color of the join button label.",
      ),
      buttonBackgroundColor: zColorNullable.describe(
        "Background color of the join button.",
      ),
      type: z
        .string()
        .optional()
        .nullable()
        .describe("Meeting provider type identifier (e.g. zoom, teams)."),
      logoUrl: z
        .string()
        .optional()
        .nullable()
        .describe("URL of the provider logo image."),
    })
    .optional()
    .nullable()
    .describe("Online meeting details, labels, and button styling."),
  style: z
    .object({
      color: zColorNullable.describe("Default text color in the meeting block."),
      backgroundColor: zColorNullable.describe(
        "Background color of the meeting block.",
      ),
      fontFamily: zFontFamily
        .optional()
        .nullable()
        .describe("Font family for meeting block text."),
      padding: zPadding
        .optional()
        .nullable()
        .describe("Inner padding around the meeting block content."),
    })
    .describe("Typography, colors, and spacing for the meeting block."),
});

export type OnlineMeetingProps = z.infer<typeof OnlineMeetingPropsSchema>;

export { OnlineMeetingPropsDefaults } from "./defaults";