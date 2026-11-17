import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const summaryPositionSchema = z
  .enum(["bottom", "right"])
  .default("bottom")
  .optional()
  .describe("Where the waitlist summary panel appears during the flow.");

export const WaitlistPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
  props: z
    .object({
      hideTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the block title in the waitlist UI."),
      hideSteps: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the step indicator in the waitlist UI."),
      scrollToTop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Scroll to the top of the block when the step changes."),
      summaryPosition: summaryPositionSchema,
    })
    .describe("Block configuration props"),
});

export type WaitlistProps = z.infer<typeof WaitlistPropsSchema>;
export type WaitlistReaderProps = BaseReaderBlockProps<any> & WaitlistProps;

export const WaitlistPropsDefaults = {
  style: {},
  props: {
    hideTitle: false,
    hideSteps: false,
    scrollToTop: true,
    summaryPosition: "bottom",
  },
} as const satisfies WaitlistProps;