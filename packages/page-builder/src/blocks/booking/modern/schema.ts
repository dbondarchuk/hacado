import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const flowOrderSchema = z
  .enum(["service-first", "specialist-first"])
  .default("service-first")
  .optional()
  .describe("Whether the guest picks a service or a specialist first");

export type FlowOrder = z.infer<typeof flowOrderSchema>;

export const summaryPositionSchema = z
  .enum(["bottom", "right"])
  .default("bottom")
  .optional()
  .describe("Where the booking summary panel appears on large screens");

export type SummaryPosition = z.infer<typeof summaryPositionSchema>;

export const BookingPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      confirmationPage: z
        .string()
        .optional()
        .nullable()
        .describe("Page slug or URL to open after a successful booking"),
      hideTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the booking block title"),
      hideSteps: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide step indicators in the booking flow"),
      scrollToTop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Scroll to top when moving between booking steps"),
      summaryPosition: summaryPositionSchema,
      flowOrder: flowOrderSchema,
      dontAllowAnySpecialist: z
        .boolean()
        .optional()
        .describe('When true, hide the "any available specialist" option'),
      lockServiceId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of a service; locks the flow so guests cannot change the selected service",
        ),
      lockMemberId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of a staff member; locks the flow so guests cannot change the selected specialist",
        ),
    })
    .describe("Block configuration props"),
});

export type BookingProps = z.infer<typeof BookingPropsSchema>;
export type BookingReaderProps = BaseReaderBlockProps<any> & BookingProps;

export const BookingPropsDefaults = {
  style: {},
  props: {
    hideTitle: false,
    hideSteps: false,
    scrollToTop: true,
    summaryPosition: "bottom",
    flowOrder: "service-first",
  },
} as const satisfies BookingProps;
