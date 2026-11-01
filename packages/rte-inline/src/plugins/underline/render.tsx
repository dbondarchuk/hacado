import type React from "react";
import type { TextMark } from "../../lib/rich-text-types";

export function renderUnderline(
  content: React.ReactNode,
  marks: TextMark,
): React.ReactNode {
  if (marks.underline) {
    return <u>{content}</u>;
  }

  return content;
}
