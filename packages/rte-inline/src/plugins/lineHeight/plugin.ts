import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const lineHeightPlugin: MarkPlugin = {
  name: "lineHeight",
  label: "Line Height",
  type: "select",
  inMoreMenu: true,
  options: [
    { value: "inherit", label: "Inherit" },
    { value: 1, label: "Tight", preview: "1" },
    { value: 1.25, label: "Snug", preview: "1.25" },
    { value: 1.5, label: "Normal", preview: "1.5" },
    { value: 1.75, label: "Relaxed", preview: "1.75" },
    { value: 2, label: "Loose", preview: "2" },
  ],
  apply: (context, value) => {
    context.applyFormat("lineHeight", value as number | "inherit");
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.lineHeight !== undefined &&
      activeMarks.marks.lineHeight !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Line height
    if (style.lineHeight && style.lineHeight !== "normal") {
      const height = Number.parseFloat(style.lineHeight);
      if (!Number.isNaN(height)) {
        result.lineHeight = height;
      }
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.lineHeight && marks.lineHeight !== "inherit") {
      styles.lineHeight = marks.lineHeight;
    }

    return styles;
  },
};
