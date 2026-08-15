import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentsContainerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
    commentsPerPage: z.number().optional(),
    sort: z.enum(["newest", "oldest"]).optional(),
  }),
});

export type BlogCommentsContainerProps = z.infer<
  typeof BlogCommentsContainerPropsSchema
>;
export type BlogCommentsContainerReaderProps = BaseReaderBlockProps<any> &
  BlogCommentsContainerProps & { appId?: string };

export const BlogCommentsContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [{ value: "flex" }],
    flexDirection: [{ value: "column" }],
    width: [{ value: { value: 100, unit: "%" } }],
    gap: [{ value: { value: 1, unit: "rem" } }],
  },
  props: {
    children: [],
    commentsPerPage: 10,
    sort: "newest",
  },
} as const satisfies BlogCommentsContainerProps;
