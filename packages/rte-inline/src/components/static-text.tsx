import { forwardRef, Ref } from "react";
import type { RichTextValue } from "../lib/rich-text-types";
import { stringToRichText } from "../lib/rich-text-utils";
import { richTextToHtml } from "../styles/apply-text-styles";

interface StaticTextProps {
  value: RichTextValue | string;
  inline?: boolean;
  className?: string;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => void;
}

export const StaticText = forwardRef<
  HTMLSpanElement | HTMLDivElement,
  StaticTextProps
>(
  (
    { value, inline = false, className = "", id, onClick }: StaticTextProps,
    ref,
  ) => {
    const richTextValue = !value
      ? stringToRichText("")
      : typeof value === "string"
        ? stringToRichText(value)
        : value;

    const html = richTextToHtml(richTextValue, inline);

    return inline ? (
      <span
        ref={ref}
        onClick={onClick}
        className={className}
        id={id}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    ) : (
      <div
        ref={ref as Ref<HTMLDivElement>}
        onClick={onClick}
        className={className}
        id={id}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
);
