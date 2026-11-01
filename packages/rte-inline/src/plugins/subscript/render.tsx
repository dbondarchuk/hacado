import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";

export function renderSubscript(
  content: React.ReactNode,
  marks: TextMark,
): React.ReactNode {
  if (marks.subscript) {
    return <sub>{content}</sub>;
  }

  return content;
}
