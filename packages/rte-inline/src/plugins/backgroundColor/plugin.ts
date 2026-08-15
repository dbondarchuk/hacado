import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";

function rgbToHex(rgb: string): string {
  // Already hex
  if (rgb.startsWith("#")) return rgb;

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = Number.parseInt(match[1]);
  const g = Number.parseInt(match[2]);
  const b = Number.parseInt(match[3]);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const backgroundColorPlugin: MarkPlugin = {
  name: "backgroundColor",
  label: "Background Color",
  type: "color",
  apply: (context, value) => {
    context.applyFormat("backgroundColor", value as string);
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return activeMarks.marks.backgroundColor !== undefined;
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Background color
    if (
      style.backgroundColor &&
      style.backgroundColor !== "transparent" &&
      style.backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      result.backgroundColor = rgbToHex(style.backgroundColor);
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.backgroundColor && marks.backgroundColor !== "inherit") {
      styles.backgroundColor = marks.backgroundColor;
    }
    return styles;
  },
};
