import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const getDefaults = (
  data: { props?: any; style?: any },
  isEditor: boolean,
) => {
  return {
    position: [
      {
        value: "relative",
      },
    ],
  };
};
