import { BaseReaderBlockProps } from "@hacado/builder";
import { asOptinalNumberField } from "@hacado/types";
import * as z from "zod";

export const ForeachContainerPropsSchema = z.object({
  props: z.object({
    value: z.string().min(1),
    skip: asOptinalNumberField(z.number().int().min(0)),
    take: asOptinalNumberField(z.number().int().min(0)),
    children: z.array(z.any()),
  }),
});

export type ForeachContainerProps = z.infer<typeof ForeachContainerPropsSchema>;
export type ForeachContainerReaderProps = BaseReaderBlockProps<any> &
  ForeachContainerProps;

export const ForeachContainerPropsDefaults = {
  props: {
    value: "",
    children: [],
  },
} satisfies ForeachContainerProps;
