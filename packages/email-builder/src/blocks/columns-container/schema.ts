import * as z from "zod";

import { BaseReaderBlockProps } from "@hacado/builder/reader";
import {
  zColorNullable,
  zPadding,
  zTextAlign,
} from "../../style-inputs/helpers/zod";

export const ColumnsContainerPropsSchema = z.object({
  style: z
    .object({
      padding: zPadding
        .optional()
        .nullable()
        .describe("Padding around the columns row."),
      backgroundColor: zColorNullable.describe(
        "Background color behind the columns row.",
      ),
      textAlign: zTextAlign
        .optional()
        .nullable()
        .describe("Default horizontal text alignment in the row."),
    })
    .optional()
    .nullable()
    .describe("Padding, background, and text alignment for the row."),
  props: z
    .object({
      fixedWidths: z
        .tuple([
          z
            .number()
            .nullable()
            .describe("Fixed width in pixels for column 1, or null for auto."),
          z
            .number()
            .nullable()
            .describe("Fixed width in pixels for column 2, or null for auto."),
          z
            .number()
            .nullable()
            .describe("Fixed width in pixels for column 3, or null for auto."),
        ])
        .optional()
        .nullable()
        .describe("Optional fixed pixel widths per column."),
      columnsCount: z
        .union([z.literal(2), z.literal(3)])
        .optional()
        .nullable()
        .describe("Number of visible columns (2 or 3)."),
      columnsGap: z
        .number()
        .optional()
        .nullable()
        .describe("Horizontal gap between columns in pixels."),
      contentAlignment: z
        .enum(["top", "middle", "bottom"])
        .optional()
        .nullable()
        .describe("Vertical alignment of content within each column."),
      columns: z
        .tuple([
          z
            .object({
              children: z
                .array(z.any())
                .describe("Blocks in the first column."),
            })
            .describe("First column slot."),
          z
            .object({
              children: z
                .array(z.any())
                .describe("Blocks in the second column."),
            })
            .describe("Second column slot."),
          z
            .object({
              children: z
                .array(z.any())
                .describe("Blocks in the third column."),
            })
            .describe("Third column slot (unused when columnsCount is 2)."),
        ])
        .describe("Three column slots; only the first N are shown."),
    })
    .describe("Multi-column layout settings and column contents."),
});

export type ColumnsContainerProps = z.infer<typeof ColumnsContainerPropsSchema>;
export type ColumnsContainerReaderProps = ColumnsContainerProps &
  BaseReaderBlockProps<any>;

export { ColumnsContainerPropsDefaults } from "./defaults";
