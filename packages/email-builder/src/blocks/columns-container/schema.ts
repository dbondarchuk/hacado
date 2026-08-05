import * as z from "zod";

import { BaseReaderBlockProps } from "@hacado/builder";
import { zStylesBase } from "../../style-inputs/helpers/zod";

export const ColumnsContainerPropsSchema = z.object({
  style: zStylesBase
    .pick({ padding: true, backgroundColor: true, textAlign: true })
    .optional()
    .nullable(),
  props: z.object({
    fixedWidths: z
      .tuple([
        z.number().nullable(),
        z.number().nullable(),
        z.number().nullable(),
      ])
      .optional()
      .nullable(),
    columnsCount: z
      .union([z.literal(2), z.literal(3)])
      .optional()
      .nullable(),
    columnsGap: z.number().optional().nullable(),
    contentAlignment: z.enum(["top", "middle", "bottom"]).optional().nullable(),
    columns: z.tuple([
      z.object({ children: z.array(z.any()) }),
      z.object({ children: z.array(z.any()) }),
      z.object({ children: z.array(z.any()) }),
    ]),
  }),
});

export type ColumnsContainerProps = z.infer<typeof ColumnsContainerPropsSchema>;
export type ColumnsContainerReaderProps = ColumnsContainerProps &
  BaseReaderBlockProps<any>;

export const ColumnsContainerPropsDefaults = {
  props: {
    contentAlignment: "middle",
    columnsCount: 3,
    columnsGap: 16,
    columns: [{ children: [] }, { children: [] }, { children: [] }],
  },
  style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
} satisfies ColumnsContainerProps;
