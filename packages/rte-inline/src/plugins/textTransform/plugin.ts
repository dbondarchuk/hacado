import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const textTransformPlugin: MarkPlugin = {
  name: "textTransform",
  label: "Text Transform",
  type: "select",
  inMoreMenu: true,
  options: [
    { value: "inherit", label: "Inherit" },
    { value: "none", label: "None" },
    { value: "uppercase", label: "Uppercase" },
    { value: "lowercase", label: "Lowercase" },
    { value: "capitalize", label: "Capitalize" },
  ],
  apply: (context, value) => {
    context.applyFormat(
      "textTransform",
      value as "uppercase" | "lowercase" | "capitalize" | "none" | "inherit",
    );
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.textTransform !== undefined &&
      activeMarks.marks.textTransform !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Text transform
    if (style.textTransform && style.textTransform !== "none") {
      result.textTransform = style.textTransform as any;
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.textTransform && marks.textTransform !== "inherit") {
      styles.textTransform = marks.textTransform;
    }

    return styles;
  },
};
