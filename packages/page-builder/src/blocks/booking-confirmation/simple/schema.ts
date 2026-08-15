import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const BookingConfirmationPropsSchema = z.object({
  style: zStyles,
  props: z.object({}),
});

export type BookingConfirmationProps = z.infer<
  typeof BookingConfirmationPropsSchema
>;
export type BookingConfirmationReaderProps = BaseReaderBlockProps<any> &
  BookingConfirmationProps;

export const BookingConfirmationPropsDefaults = {
  style: {
    alignItems: [
      {
        value: "stretch",
      },
    ],
    justifyContent: [
      {
        value: "center",
      },
    ],
  },
  props: {},
} as const satisfies BookingConfirmationProps;
