import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const fontSizePlugin: MarkPlugin = {
  name: "fontSize",
  label: "Font Size",
  type: "number",
  defaultValue: 16,
  options: [
    { value: "inherit", label: "Inherit" },
    { value: 12, label: "12px" },
    { value: 14, label: "14px" },
    { value: 16, label: "16px" },
    { value: 18, label: "18px" },
    { value: 20, label: "20px" },
    { value: 24, label: "24px" },
    { value: 28, label: "28px" },
    { value: 32, label: "32px" },
    { value: 36, label: "36px" },
    { value: 48, label: "48px" },
  ],
  apply: (context, value) => {
    context.applyFormat("fontSize", value as number | "inherit");
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.fontSize !== undefined &&
      activeMarks.marks.fontSize !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Font size
    if (style.fontSize) {
      const size = Number.parseFloat(style.fontSize);
      if (!Number.isNaN(size)) {
        result.fontSize = Math.round(size);
      }
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.fontSize && marks.fontSize !== "inherit") {
      styles.fontSize = `${marks.fontSize}px`;
    }

    return styles;
  },
};
