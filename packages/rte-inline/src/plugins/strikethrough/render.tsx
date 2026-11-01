import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";

export function renderStrikethrough(
  content: React.ReactNode,
  marks: TextMark,
): React.ReactNode {
  if (marks.strikethrough) {
    return <s>{content}</s>;
  }

  return content;
}
