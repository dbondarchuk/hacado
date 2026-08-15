import type { SlateRenderElementProps } from "@udecode/plate";
import type { TIndentElement } from "@udecode/plate-indent";
import type { CSSProperties } from "react";

import { cn } from "@hacado/ui";

export const FireMarker = (
  props: Omit<SlateRenderElementProps, "children">,
) => {
  const { element } = props;

  return (
    <div contentEditable={false}>
      <span
        className="select-none"
        style={{ left: -26, position: "absolute", top: -1 }}
        data-plate-prevent-deserialization
        contentEditable={false}
      >
        {(element as TIndentElement).indent % 2 === 0 ? "🔥" : "🚀"}
      </span>
    </div>
  );
};

export const FireLiComponent = (props: SlateRenderElementProps) => {
  const { children, style, className } = props as SlateRenderElementProps & {
    style?: CSSProperties;
    className?: string;
  };

  return (
    <li className={cn("list-none", className)} style={style}>
      {children}
    </li>
  );
};
