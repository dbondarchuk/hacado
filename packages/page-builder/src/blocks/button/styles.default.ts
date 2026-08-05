import type {
  AllStylesSchemas,
  DefaultCSSProperties,
} from "@hacado/page-builder-base/style";
import type { ButtonProps } from "./schema";

export function getRoundedCorners(
  style: "rectangle" | "pill" | "rounded" = "rounded",
) {
  switch (style) {
    case "rectangle":
      return 0;
    case "pill":
      return 64;
    case "rounded":
    default:
      return 10;
  }
}

export const getButtonSizePadding = (
  size: "x-small" | "small" | "large" | "medium" = "medium",
) => {
  switch (size) {
    case "x-small":
      return { top: 0.25, bottom: 0.25, left: 0.5, right: 0.5 };
    case "small":
      return { top: 0.5, bottom: 0.5, left: 0.75, right: 0.75 };
    case "large":
      return { top: 2, bottom: 2, left: 4, right: 4 };
    case "medium":
    default:
      return { top: 0.75, bottom: 0.75, left: 1.5, right: 1.5 };
  }
};

export const getDefaults = (
  { props, style }: ButtonProps,
  isEditor?: boolean,
): DefaultCSSProperties<AllStylesSchemas> => {
  const padding = getButtonSizePadding("medium");
  const borderRadius = getRoundedCorners("rounded");

  return {
    fontSize: { value: 1, unit: "rem" },
    fontWeight: "normal",
    textAlign: "center",
    borderRadius: { value: borderRadius, unit: "px" },
    padding: {
      top: { value: padding.top, unit: "rem" },
      bottom: { value: padding.bottom, unit: "rem" },
      left: { value: padding.left, unit: "rem" },
      right: { value: padding.right, unit: "rem" },
    },
    display: "block",
  };
};
