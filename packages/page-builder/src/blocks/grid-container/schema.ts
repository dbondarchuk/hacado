import { BaseReaderBlockProps } from "@hacado/builder/reader";
import {
  backgroundVideoStyle,
  getAllStylesWithAdditionalStyles,
  getStylesSchema,
} from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = getAllStylesWithAdditionalStyles({
  backgroundVideo: backgroundVideoStyle,
});

export const zStyles = getStylesSchema(styles);

export const GridContainerPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      children: z
        .array(z.any())
        .describe("Nested child blocks laid out in the grid"),
    })
    .describe("Block configuration props"),
});

export type GridContainerProps = z.infer<typeof GridContainerPropsSchema>;
export type GridContainerReaderProps = BaseReaderBlockProps<any> &
  GridContainerProps;

export { GridContainerPropsDefaults } from "./defaults";