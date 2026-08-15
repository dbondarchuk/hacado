import type { SlateElementProps } from "@udecode/plate";
import type { TCodeBlockElement } from "@udecode/plate-code-block";

import { cn } from "@hacado/ui";
import { SlateElement } from "@udecode/plate";

import "./code-block-element.css";
import { languages } from "./prism";

export const CodeBlockElementStatic = ({
  children,
  className,
  ...props
}: SlateElementProps<TCodeBlockElement>) => {
  const { element } = props;

  const state = {
    className: element?.lang ? `${element.lang} language-${element.lang}` : "",
  };

  return (
    <SlateElement className={cn(className, "py-1", state.className)} {...props}>
      <pre className="overflow-x-auto rounded-md bg-muted px-6 py-8 font-mono text-sm leading-[normal] [tab-size:2] line-numbers">
        <code>{children}</code>
      </pre>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 select-none text-xs text-muted-foreground">
        {element.lang
          ? languages.find((language) => language.value === element.lang)
              ?.label || element.lang
          : "Plain Text"}
      </div>
    </SlateElement>
  );
};
