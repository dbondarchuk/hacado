import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";

export const ConditionalContainerPropsSchema = z.object({
  props: z
    .object({
      condition: z
        .string()
        .min(1)
        .describe(
          "Expression evaluated at send time; truthy shows the then branch.",
        ),
      then: z
        .object({
          children: z
            .array(z.any())
            .describe("Blocks rendered when the condition is true."),
        })
        .describe("Content shown when the condition matches."),
      otherwise: z
        .object({
          children: z
            .array(z.any())
            .optional()
            .nullable()
            .describe("Blocks rendered when the condition is false."),
        })
        .describe("Optional fallback content when the condition is false."),
    })
    .describe("Conditional branch settings and nested blocks."),
});

export type ConditionalContainerProps = z.infer<
  typeof ConditionalContainerPropsSchema
>;

export type ConditionalContainerReaderProps = BaseReaderBlockProps<any> &
  ConditionalContainerProps;

export { ConditionalContainerPropsDefaults } from "./defaults";