import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const fontWeightPlugin: MarkPlugin = {
  name: "fontWeight",
  label: "Font Weight",
  type: "select",
  options: [
    { value: "inherit", label: "Inherit" },
    { value: 100, label: "Thin", preview: "100" },
    { value: 200, label: "Extra Light", preview: "200" },
    { value: 300, label: "Light", preview: "300" },
    { value: 400, label: "Normal", preview: "400" },
    { value: 500, label: "Medium", preview: "500" },
    { value: 600, label: "Semi Bold", preview: "600" },
    { value: 700, label: "Bold", preview: "700" },
    { value: 800, label: "Extra Bold", preview: "800" },
    { value: 900, label: "Black", preview: "900" },
  ],
  apply: (context, value) => {
    context.applyFormat("fontWeight", value as number | "inherit");
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.fontWeight !== undefined &&
      activeMarks.marks.fontWeight !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const computedStyle = window.getComputedStyle(element);
    const result: Partial<TextMark> = {};

    // Font weight (handled by bold plugin, but we can also parse explicit weights)
    if (style.fontWeight && style.fontWeight !== "normal") {
      const weight = Number.parseInt(style.fontWeight);
      if (!Number.isNaN(weight)) {
        result.fontWeight = weight;
      }
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.fontWeight && marks.fontWeight !== "inherit") {
      styles.fontWeight = marks.fontWeight;
    }

    return styles;
  },
};
