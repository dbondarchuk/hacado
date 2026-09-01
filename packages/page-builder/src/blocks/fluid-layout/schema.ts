import { BaseReaderBlockProps } from "@hacado/builder";
import {
  backgroundVideoStyle,
  getAllStylesWithAdditionalStyles,
  getStylesSchema,
} from "@hacado/page-builder-base/style";
import * as z from "zod";

export const FLUID_COLUMNS = 24;
export const FLUID_TABLET_COLUMNS = 12;
export const FLUID_MOBILE_COLUMNS = 8;
export const FLUID_DEFAULT_COL_SPAN = 6;
export const FLUID_DEFAULT_ROW_SPAN = 4;
export const FLUID_DEFAULT_ROW_HEIGHT = 24;
export const FLUID_DEFAULT_GAP = 8;
export const FLUID_TABLET_MAX_WIDTH = "64rem"; // matches max-lg (1024px)
export const FLUID_MOBILE_MAX_WIDTH = "40rem"; // matches max-sm (640px)

export const styles = getAllStylesWithAdditionalStyles({
  backgroundVideo: backgroundVideoStyle,
});
export const zStyles = getStylesSchema(styles);

export const fluidPlacementSchema = z.object({
  colStart: z.number().int().min(1).max(FLUID_COLUMNS),
  colEnd: z
    .number()
    .int()
    .min(2)
    .max(FLUID_COLUMNS + 1),
  rowStart: z.number().int().min(1),
  rowEnd: z.number().int().min(2),
  zIndex: z.number().int().default(0),
  /** Rotation in degrees around the cell center. */
  rotate: z.number().optional(),
});

export type FluidPlacement = z.infer<typeof fluidPlacementSchema>;

export const fluidPlacementViewportSchema = z.enum([
  "tablet",
  "mobile",
  "mobileLandscape",
]);

export type FluidPlacementViewport = z.infer<
  typeof fluidPlacementViewportSchema
>;

export const fluidPlacementOverridesSchema = z.object({
  tablet: z.record(z.string(), fluidPlacementSchema).optional(),
  mobile: z.record(z.string(), fluidPlacementSchema).optional(),
  mobileLandscape: z.record(z.string(), fluidPlacementSchema).optional(),
});

export type FluidPlacementOverrides = z.infer<
  typeof fluidPlacementOverridesSchema
>;

export const FluidLayoutPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
    placements: z.record(z.string(), fluidPlacementSchema).default({}),
    placementOverrides: fluidPlacementOverridesSchema.default({}),
    rowHeight: z.number().int().min(8).default(FLUID_DEFAULT_ROW_HEIGHT),
    gap: z.number().int().min(0).default(FLUID_DEFAULT_GAP),
  }),
});

export type FluidLayoutProps = z.infer<typeof FluidLayoutPropsSchema>;
export type FluidLayoutReaderProps = BaseReaderBlockProps<any> &
  FluidLayoutProps;

export const FluidLayoutPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1.5, unit: "rem" },
          bottom: { value: 1.5, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
    width: [
      {
        value: { value: 100, unit: "%" },
      },
    ],
    minHeight: [
      {
        value: { value: 16, unit: "rem" },
      },
    ],
  },
  props: {
    children: [],
    placements: {},
    placementOverrides: {},
    rowHeight: FLUID_DEFAULT_ROW_HEIGHT,
    gap: FLUID_DEFAULT_GAP,
  },
} as const satisfies FluidLayoutProps;
