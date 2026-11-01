import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

export const letterSpacingPlugin: MarkPlugin = {
  name: "letterSpacing",
  label: "Letter Spacing",
  type: "select",
  inMoreMenu: true,
  options: [
    { value: "inherit", label: "Inherit" },
    { value: "tight", label: "Tight" },
    { value: "normal", label: "Normal" },
    { value: "wide", label: "Wide" },
  ],
  apply: (context, value) => {
    context.applyFormat(
      "letterSpacing",
      value as "tight" | "normal" | "wide" | "inherit",
    );
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.letterSpacing !== undefined &&
      activeMarks.marks.letterSpacing !== "inherit"
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Letter spacing
    if (style.letterSpacing && style.letterSpacing !== "normal") {
      const spacing = Number.parseFloat(style.letterSpacing);
      if (!Number.isNaN(spacing)) {
        if (spacing <= -0.5) result.letterSpacing = "tight";
        else if (spacing >= 0.5) result.letterSpacing = "wide";
        else result.letterSpacing = "normal";
      }
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.letterSpacing && marks.letterSpacing !== "inherit") {
      const spacingMap = { tight: "-0.025em", normal: "0em", wide: "0.05em" };
      styles.letterSpacing = spacingMap[marks.letterSpacing];
    }

    return styles;
  },
};
