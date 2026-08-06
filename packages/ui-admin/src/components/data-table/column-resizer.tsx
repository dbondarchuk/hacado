import { cn } from "@hacado/ui";
import { Header } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";

export const ColumnResizer = <TData,>({
  header,
  className,
}: {
  header: Header<TData, unknown>;
  className?: string;
}) => {
  const defaultClass =
    "absolute top-0 right-0 w-px h-full bg-border hover:bg-border items-center justify-center flex";
  if (header.column.getCanResize() === false)
    return <div className={cn(defaultClass, className)} />;

  return (
    <div
      {...{
        onDoubleClick: () => header.column.resetSize(),
        onMouseDown: header.getResizeHandler(),
        onTouchStart: header.getResizeHandler(),
        className: cn(defaultClass, "cursor-col-resize", className),
        style: {
          userSelect: "none",
          touchAction: "none",
        },
      }}
    >
      <div
        className={cn(
          "z-10 flex h-4 w-3 items-center justify-center rounded-sm invisible group-hover/resizer:visible group-hover/thead:z-[99999]",
          header.column.getIsResizing() && "visible",
        )}
      >
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    </div>
  );
};
