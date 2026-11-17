import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { asOptinalNumberField } from "@hacado/types/utils";
import * as z from "zod";

export const ForeachContainerPropsSchema = z.object({
  props: z
    .object({
      value: z
        .string()
        .min(1)
        .describe(
          "Data binding path for the collection to iterate (e.g. variable name).",
        ),
      skip: asOptinalNumberField(z.number().int().min(0)).describe(
        "Number of items to skip from the start of the collection.",
      ),
      take: asOptinalNumberField(z.number().int().min(0)).describe(
        "Maximum number of items to render after skip.",
      ),
      children: z
        .array(z.any())
        .describe(
          "Block template repeated once per item in the bound collection.",
        ),
    })
    .describe("Loop settings and template blocks for each item."),
});

export type ForeachContainerProps = z.infer<typeof ForeachContainerPropsSchema>;
export type ForeachContainerReaderProps = BaseReaderBlockProps<any> &
  ForeachContainerProps;

export { ForeachContainerPropsDefaults } from "./defaults";
