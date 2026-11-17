import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const ContainerPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      children: z
        .array(z.any())
        .describe("Nested child blocks inside the container"),
    })
    .describe("Block configuration props"),
});

export type ContainerProps = z.infer<typeof ContainerPropsSchema>;
export type ContainerReaderProps = BaseReaderBlockProps<any> & ContainerProps;

export { ContainerPropsDefaults } from "./defaults";