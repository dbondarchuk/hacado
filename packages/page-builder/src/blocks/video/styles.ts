import {
  ALL_STYLES,
  AllStylesSchemas,
  getStylesSchema,
} from "@hacado/page-builder-base/style";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);
export type VideoStylesSchema = AllStylesSchemas;
