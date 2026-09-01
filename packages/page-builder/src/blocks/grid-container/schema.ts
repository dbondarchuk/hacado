import { BaseReaderBlockProps } from "@hacado/builder";
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
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
  }),
});

export type GridContainerProps = z.infer<typeof GridContainerPropsSchema>;
export type GridContainerReaderProps = BaseReaderBlockProps<any> &
  GridContainerProps;

export const GridContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    display: [
      {
        value: "grid",
      },
    ],
    gridTemplateColumns: [
      {
        value: "repeat(auto-fit, minmax(250px, 1fr))",
      },
    ],
    gap: [
      {
        value: {
          value: 1,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    children: [],
  },
} as const satisfies GridContainerProps;
