import { BaseReaderBlockProps } from "@hacado/builder/reader";
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
  colStart: z
    .number()
    .int()
    .min(1)
    .max(FLUID_COLUMNS)
    .describe("First grid column (1-based) for this child"),
  colEnd: z
    .number()
    .int()
    .min(2)
    .max(FLUID_COLUMNS + 1)
    .describe("Column after the last occupied column (exclusive end)"),
  rowStart: z
    .number()
    .int()
    .min(1)
    .describe("First grid row (1-based) for this child"),
  rowEnd: z
    .number()
    .int()
    .min(2)
    .describe("Row after the last occupied row (exclusive end)"),
  zIndex: z
    .number()
    .int()
    .default(0)
    .describe("Stacking order when placements overlap"),
  /** Rotation in degrees around the cell center. */
  rotate: z
    .number()
    .optional()
    .describe("Rotation in degrees around the placement center"),
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
  tablet: z
    .record(z.string(), fluidPlacementSchema)
    .optional()
    .describe("Per-child placement overrides on tablet breakpoints"),
  mobile: z
    .record(z.string(), fluidPlacementSchema)
    .optional()
    .describe("Per-child placement overrides on mobile portrait"),
  mobileLandscape: z
    .record(z.string(), fluidPlacementSchema)
    .optional()
    .describe("Per-child placement overrides on mobile landscape"),
});

export type FluidPlacementOverrides = z.infer<
  typeof fluidPlacementOverridesSchema
>;

export const FluidLayoutPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      children: z
        .array(z.any())
        .describe("Child blocks positioned on the fluid grid"),
      placements: z
        .record(z.string(), fluidPlacementSchema)
        .default({})
        .describe("Default desktop placements keyed by child block id"),
      placementOverrides: fluidPlacementOverridesSchema
        .default({})
        .describe("Responsive placement overrides per viewport"),
      rowHeight: z
        .number()
        .int()
        .min(8)
        .default(FLUID_DEFAULT_ROW_HEIGHT)
        .describe("Height in pixels of one grid row"),
      gap: z
        .number()
        .int()
        .min(0)
        .default(FLUID_DEFAULT_GAP)
        .describe("Gap in pixels between grid cells"),
    })
    .describe("Block configuration props"),
});

export type FluidLayoutProps = z.infer<typeof FluidLayoutPropsSchema>;
export type FluidLayoutReaderProps = BaseReaderBlockProps<any> &
  FluidLayoutProps;

export { FluidLayoutPropsDefaults } from "./defaults";
