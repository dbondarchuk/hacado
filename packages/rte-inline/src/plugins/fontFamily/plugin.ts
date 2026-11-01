import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const fontFamilyPlugin: MarkPlugin = {
  name: "fontFamily",
  label: "Font Family",
  type: "select",
  options: [
    { value: "inherit", label: "Inherit" },
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Courier New, monospace", label: "Courier New" },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
  ],
  apply: (context, value) => {
    context.applyFormat("fontFamily", value as string | "inherit");
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.fontFamily !== undefined &&
      activeMarks.marks.fontFamily !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Font family
    if (style.fontFamily) {
      result.fontFamily = style.fontFamily
        .replace(/["']/g, "")
        .split(",")[0]
        .trim();
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.fontFamily && marks.fontFamily !== "inherit") {
      styles.fontFamily = marks.fontFamily;
    }

    return styles;
  },
};
