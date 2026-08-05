import type { SlateElementProps } from "@udecode/plate";

import { cn } from "@hacado/ui";
import { SlateElement } from "@udecode/plate";

export const ParagraphElementStatic = ({
  children,
  className,
  ...props
}: SlateElementProps) => {
  return (
    <SlateElement
      className={cn(className, "m-0 px-0 py-1")}
      style={{ whiteSpace: "pre-line" }}
      {...props}
    >
      {children}
    </SlateElement>
  );
};
