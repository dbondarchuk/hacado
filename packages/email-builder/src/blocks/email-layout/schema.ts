import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import {
  zColor,
  zColorNullable,
  zFontFamily,
  zPadding,
} from "../../style-inputs/helpers/zod";

const EmailLayoutPropsSchema = z.object({
  backdropColor: zColor.describe(
    "Page background color outside the email canvas.",
  ),
  borderColor: zColorNullable.describe("Border color around the email canvas."),
  borderRadius: z.coerce
    .number<number>()
    .int("emailBuilder.common.validation.borderRadius")
    .optional()
    .nullable()
    .describe("Corner radius of the email canvas in pixels."),
  canvasColor: zColor.describe(
    "Background color of the main email content area.",
  ),
  textColor: zColor.describe("Default text color for blocks in the layout."),
  fontFamily: zFontFamily.describe("Default font family for the email."),
  maxWidth: z.coerce
    .number<number>()
    .int("emailBuilder.common.validation.maxWidth")
    .min(500, "emailBuilder.common.validation.maxWidth")
    .max(1200, "emailBuilder.common.validation.maxWidth")
    .optional()
    .nullable()
    .describe("Maximum width of the email canvas in pixels."),
  padding: zPadding.describe("Inner padding around the email canvas."),
  previewText: z
    .string()
    .optional()
    .nullable()
    .describe("Inbox preview snippet shown after the subject line."),
  children: z
    .array(z.any())
    .describe("Top-level blocks rendered inside the email layout."),
});

export default EmailLayoutPropsSchema;

export type EmailLayoutProps = z.infer<typeof EmailLayoutPropsSchema>;
export type EmailLayoutReaderProps = BaseReaderBlockProps<any> &
  EmailLayoutProps;

export { EmailLayoutDefaultProps } from "./defaults";
