import type { TextMark } from "../../lib/rich-text-types";
import type { MarkPlugin } from "../types";
import { renderBold } from "./render";

export const boldPlugin: MarkPlugin = {
  name: "bold",
  label: "Bold",
  type: "boolean",
  icon: "bold",
  keyboardShortcut: {
    key: "b",
    metaKey: true,
    ctrlKey: true,
  },
  apply: (context, value) => {
    const activeMarks = context.getActiveMarks();
    const isActive =
      activeMarks.marks.bold || activeMarks.marks.fontWeight === 700;

    context.applyFormat("fontWeight", isActive ? "inherit" : 700);
  },
  isActive: (context) => {
    const activeMarks = context.getActiveMarks();
    return (
      activeMarks.marks.bold !== undefined ||
      activeMarks.marks.fontWeight === 700
    );
  },
  parseHTML: (element, marks) => {
    const style = element.style;
    const computedStyle = window.getComputedStyle(element);
    const result: Partial<TextMark> = {};

    // Bold/font-weight
    if (
      element.tagName === "STRONG" ||
      element.tagName === "B" ||
      style.fontWeight ||
      Number.parseInt(computedStyle.fontWeight) >= 600
    ) {
      const weight = style.fontWeight || computedStyle.fontWeight;
      const isTagBold = element.tagName === "B" || element.tagName === "STRONG";
      if (weight === "bold" || Number.parseInt(weight) >= 600 || isTagBold) {
        if (Number.parseInt(weight) === 700 || isTagBold) {
          result.bold = true;
        } else {
          result.fontWeight = Number.parseInt(weight);
        }
      }
    }

    return result;
  },
  render: renderBold,
};
