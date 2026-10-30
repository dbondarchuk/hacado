import type { SlateElementProps } from "@udecode/plate";

import { cn } from "@hacado/ui/cn";
import { SlateElement } from "@udecode/plate";

export function TableRowElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  return (
    <SlateElement as="tr" className={cn(className, "h-full")} {...props}>
      {children}
    </SlateElement>
  );
}
