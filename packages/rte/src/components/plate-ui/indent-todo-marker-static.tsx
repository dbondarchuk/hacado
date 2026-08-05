import { cn } from "@hacado/ui";
import type { SlateRenderElementProps } from "@udecode/plate";
import type { CSSProperties } from "react";
import { CheckboxStatic } from "./checkbox-static";

export const TodoMarkerStatic = ({
  element,
}: Omit<SlateRenderElementProps, "children">) => {
  return (
    <div contentEditable={false}>
      <CheckboxStatic
        className="pointer-events-none absolute top-1 -left-6"
        checked={element.checked as boolean}
      />
    </div>
  );
};

export const TodoLiStatic = ({
  children,
  element,
  style,
  className,
}: SlateRenderElementProps & {
  style?: CSSProperties;
  className?: string;
}) => {
  return (
    <li
      className={cn(
        "list-none",
        (element.checked as boolean) && "text-muted-foreground line-through",
        className,
      )}
      style={style}
    >
      {children}
    </li>
  );
};
