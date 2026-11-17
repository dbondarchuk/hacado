import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";

export const ConditionalContainerPropsSchema = z.object({
  props: z
    .object({
      condition: z
        .string()
        .min(1)
        .describe("Expression evaluated to choose then vs otherwise branch"),
      then: z
        .object({
          children: z
            .array(z.any())
            .describe("Child blocks when the condition is truthy"),
        })
        .describe("Content shown when condition is true"),
      otherwise: z
        .object({
          children: z
            .array(z.any())
            .optional()
            .nullable()
            .describe("Child blocks when the condition is falsy"),
        })
        .describe("Content shown when condition is false"),
    })
    .describe("Block configuration props"),
});

export type ConditionalContainerProps = z.infer<
  typeof ConditionalContainerPropsSchema
>;

export type ConditionalContainerReaderProps = BaseReaderBlockProps<any> &
  ConditionalContainerProps;

export { ConditionalContainerPropsDefaults } from "./defaults";
