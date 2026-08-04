import { BaseReaderBlockProps } from "@timelish/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const flowOrderSchema = z
  .enum(["service-first", "specialist-first"])
  .default("service-first")
  .optional();

export type FlowOrder = z.infer<typeof flowOrderSchema>;

export const BookingWithWaitlistPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    confirmationPage: z.string().optional().nullable(),
    flowOrder: flowOrderSchema,
  }),
});

export type BookingWithWaitlistProps = z.infer<
  typeof BookingWithWaitlistPropsSchema
>;
export type BookingWithWaitlistReaderProps = BaseReaderBlockProps<any> &
  BookingWithWaitlistProps;

export const BookingWithWaitlistPropsDefaults = {
  style: {
    display: [
      {
        value: "grid",
      },
    ],
    gridTemplateColumns: [
      {
        value: "1fr",
      },
      {
        value: "repeat(2, 1fr)",
        breakpoint: ["md"],
      },
      {
        value: "repeat(3, 1fr)",
        breakpoint: ["lg"],
      },
    ],
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
    gap: [
      {
        value: {
          value: 2.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    flowOrder: "service-first",
  },
} as const satisfies BookingWithWaitlistProps;
