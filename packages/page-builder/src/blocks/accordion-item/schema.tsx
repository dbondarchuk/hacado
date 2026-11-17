import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { InlineContainerPropsDefaults } from "../inline-container/schema";
import { zStyles } from "./styles";

export const AccordionItemPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      title: z
        .object({
          children: z
            .array(z.any())
            .max(1)
            .describe("Single slot for the clickable header label."),
        })
        .describe("Header region shown when the item is collapsed or expanded."),
      content: z
        .object({
          children: z
            .array(z.any())
            .describe("Blocks shown inside the panel when expanded."),
        })
        .describe("Expandable body region."),
      isOpen: z
        .boolean()
        .optional()
        .nullable()
        .describe("Whether this item's panel is expanded."),
    })
    .describe("Block configuration props"),
});

export type AccordionItemProps = z.infer<typeof AccordionItemPropsSchema>;
export type AccordionItemReaderProps = BaseReaderBlockProps<any> &
  AccordionItemProps;

export { AccordionItemPropsDefaults } from "./defaults";