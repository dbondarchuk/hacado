import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const BookingConfirmationPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    newBookingPage: z.string().optional().nullable(),
  }),
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
