import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";

export function renderSuperscript(
  content: React.ReactNode,
  marks: TextMark,
): React.ReactNode {
  if (marks.superscript) {
    return <sup>{content}</sup>;
  }

  return content;
}
