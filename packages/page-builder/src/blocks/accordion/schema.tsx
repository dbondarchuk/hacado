import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const AccordionPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      allowMultipleOpen: z
        .boolean()
        .optional()
        .nullable()
        .describe("Allow more than one accordion item to be open at once."),
      defaultOpenFirst: z
        .boolean()
        .optional()
        .nullable()
        .describe("Open the first item when the accordion first renders."),
      animation: z
        .enum(["slide", "fade", "none"])
        .optional()
        .nullable()
        .describe("Transition when panels open or close."),
      iconPosition: z
        .enum(["left", "right"])
        .optional()
        .nullable()
        .describe("Side of the header where the expand icon appears."),
      iconStyle: z
        .enum(["plus", "plus-x", "arrow", "chevron"])
        .optional()
        .nullable()
        .describe("Visual style of the expand/collapse icon."),
      children: z
        .array(z.any())
        .describe("AccordionItem blocks rendered inside the accordion."),
    })
    .describe("Block configuration props"),
});

export type AccordionProps = z.infer<typeof AccordionPropsSchema>;
export type AccordionReaderProps = BaseReaderBlockProps<any> & AccordionProps;