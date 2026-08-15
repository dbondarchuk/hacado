import {
  fillStyle,
  getAllStylesWithAdditionalStyles,
  getStylesSchema,
} from "@hacado/page-builder-base/style";

export const styles = getAllStylesWithAdditionalStyles({
  fill: fillStyle,
});

export const zStyles = getStylesSchema(styles);
export type IconStylesSchema = {
  [key in keyof typeof styles]: (typeof styles)[key]["schema"];
};
