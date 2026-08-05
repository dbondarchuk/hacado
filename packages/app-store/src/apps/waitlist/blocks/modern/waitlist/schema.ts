import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const WaitlistPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    hideTitle: z.boolean().optional().nullable(),
    hideSteps: z.boolean().optional().nullable(),
    scrollToTop: z.boolean().optional().nullable(),
  }),
});

export type WaitlistProps = z.infer<typeof WaitlistPropsSchema>;
export type WaitlistReaderProps = BaseReaderBlockProps<any> & WaitlistProps;

export const WaitlistPropsDefaults = {
  style: {},
  props: {
    hideTitle: false,
    hideSteps: false,
    scrollToTop: true,
  },
} as const satisfies WaitlistProps;
