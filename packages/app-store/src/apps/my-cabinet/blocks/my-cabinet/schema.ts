import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const MyCabinetBlockPropsSchema = z.object({
  props: z
    .object({
      showTitle: z.boolean().optional().nullable(),
      scrollToTop: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type MyCabinetBlockProps = Prettify<
  z.infer<typeof MyCabinetBlockPropsSchema>
>;
export type MyCabinetBlockReaderProps = BaseReaderBlockProps<any> &
  MyCabinetBlockProps;

export const MyCabinetBlockPropsDefaults = {
  props: {
    showTitle: true,
    scrollToTop: true,
  },
  style: {},
} as const satisfies MyCabinetBlockProps;
