import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const AccordionPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    allowMultipleOpen: z.boolean().optional().nullable(),
    defaultOpenFirst: z.boolean().optional().nullable(),
    animation: z.enum(["slide", "fade", "none"]).optional().nullable(),
    iconPosition: z.enum(["left", "right"]).optional().nullable(),
    iconStyle: z.enum(["plus", "arrow", "chevron"]).optional().nullable(),
    children: z.array(z.any()),
  }),
});

export type AccordionProps = z.infer<typeof AccordionPropsSchema>;
export type AccordionReaderProps = BaseReaderBlockProps<any> & AccordionProps;
