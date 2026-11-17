import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const SpacerPropsSchema = z.object({
  style: zStyles
    .optional()
    .nullable()
    .describe(
      "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
    ),
  props: z
    .object({})
    .optional()
    .nullable()
    .describe("Block configuration props"),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;
export type SpacerReaderProps = BaseReaderBlockProps<any> & SpacerProps;

export { SpacerPropsDefaults } from "./defaults";