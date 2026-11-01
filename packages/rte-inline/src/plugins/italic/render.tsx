import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";

export function renderItalic(
  content: React.ReactNode,
  marks: TextMark,
): React.ReactNode {
  if (marks.italic) {
    return <em>{content}</em>;
  }

  return content;
}
