import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const flowOrderSchema = z
  .enum(["service-first", "specialist-first"])
  .default("service-first")
  .optional()
  .describe("Whether users pick service or specialist first in the booking steps.");

export type FlowOrder = z.infer<typeof flowOrderSchema>;

export const summaryPositionSchema = z
  .enum(["bottom", "right"])
  .default("bottom")
  .optional()
  .describe("Where the booking summary panel appears during the flow.");

export type SummaryPosition = z.infer<typeof summaryPositionSchema>;

export const BookingWithWaitlistPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
  props: z
    .object({
      confirmationPage: z
        .string()
        .optional()
        .nullable()
        .describe("Page slug or URL shown after a successful booking."),
      hideTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the block title in the booking UI."),
      hideSteps: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the step indicator in the booking UI."),
      scrollToTop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Scroll to the top of the block when the step changes."),
      summaryPosition: summaryPositionSchema,
      flowOrder: flowOrderSchema,
      dontAllowAnySpecialist: z
        .boolean()
        .optional()
        .describe('Disallow the "any specialist" option when choosing staff.'),
      lockServiceId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of the service to preselect and lock; users cannot change it.",
        ),
      lockMemberId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of the staff member to preselect and lock; users cannot change it.",
        ),
    })
    .describe("Block configuration props"),
});

export type BookingWithWaitlistProps = z.infer<
  typeof BookingWithWaitlistPropsSchema
>;

export type BookingWithWaitlistReaderProps = BaseReaderBlockProps<any> &
  BookingWithWaitlistProps & { appId?: string };

export const BookingWithWaitlistPropsDefaults = {
  style: {},
  props: {
    hideTitle: false,
    hideSteps: false,
    scrollToTop: true,
    summaryPosition: "bottom",
    flowOrder: "service-first",
  },
} as const satisfies BookingWithWaitlistProps;