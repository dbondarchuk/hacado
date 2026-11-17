import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const BookingConfirmationPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z.object({}).describe("Block configuration props"),
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
