import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";

export const ConditionalContainerPropsSchema = z.object({
  props: z.object({
    condition: z.string().min(1),
    then: z.object({
      children: z.array(z.any()),
    }),
    otherwise: z.object({
      children: z.array(z.any()).optional().nullable(),
    }),
  }),
});

export type ConditionalContainerProps = z.infer<
  typeof ConditionalContainerPropsSchema
>;

export type ConditionalContainerReaderProps = BaseReaderBlockProps<any> &
  ConditionalContainerProps;

export const ConditionalContainerPropsDefaults = {
  props: {
    condition: "",
    then: { children: [] },
    otherwise: { children: [] },
  },
} satisfies ConditionalContainerProps;
