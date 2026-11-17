import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const BookingConfirmationPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      newBookingPage: z
        .string()
        .optional()
        .nullable()
        .describe("Page slug or URL for starting another booking"),
    })
    .describe("Block configuration props"),
});

export type BookingConfirmationProps = z.infer<
  typeof BookingConfirmationPropsSchema
>;

export type BookingConfirmationReaderProps = BaseReaderBlockProps<any> &
  BookingConfirmationProps;

export const BookingConfirmationPropsDefaults = {
  style: {},
  props: {},
} as const satisfies BookingConfirmationProps;