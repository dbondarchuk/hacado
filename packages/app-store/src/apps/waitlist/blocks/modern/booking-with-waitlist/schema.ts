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
    hideTitle: z.boolean().optional().nullable(),
    hideSteps: z.boolean().optional().nullable(),
    scrollToTop: z.boolean().optional().nullable(),
    flowOrder: flowOrderSchema,
  }),
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
    flowOrder: "service-first",
  },
} as const satisfies BookingWithWaitlistProps;
