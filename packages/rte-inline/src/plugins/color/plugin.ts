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

export const colorPlugin: MarkPlugin = {
  name: "color",
  label: "Text Color",
  type: "color",
  apply: (context, value) => {
    context.applyFormat("color", value as string);
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return activeMarks.marks.color !== undefined;
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const result: Partial<TextMark> = {};

    // Text color
    if (style.color) {
      result.color = rgbToHex(style.color);
    }

    return result;
  },
  getStyles: (marks) => {
    const styles: React.CSSProperties = {};
    if (marks.color && marks.color !== "inherit") {
      styles.color = marks.color;
    }
    return styles;
  },
};
