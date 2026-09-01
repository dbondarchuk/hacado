import { memo, RefCallback } from "react";
import { useBlockDisableOptions } from "../../documents/editor/context";
import { DragHandle } from "./drag-handle";
import { NavMenu } from "./nav-menu";
import { ResizeDirection } from "./types";

export const SelectedBlockOverlay = memo(
  ({
    top,
    left,
    width,
    height,
    id,
    handleRef,
    onResize,
    startResize,
  }: {
    top: number;
    left: number;
    width: number;
    height: number;
    id: string;
    handleRef: RefCallback<Element>;
    onResize?: (width: number, height: number) => void;
    startResize: (e: React.MouseEvent, dir: ResizeDirection) => void;
  }) => {
    const disable = useBlockDisableOptions(id);

    return (
      <div
        className="absolute border-2 border-blue-500"
        style={{
          top,
          left,
          width,
          height,
        }}
      >
        {/* Drag handle */}
        {!disable?.drag && <DragHandle handleRef={handleRef} />}
        <div className="absolute -translate-y-full left-[-2px] top-[-2px]  z-[10] hover:z-50 pointer-events-auto">
          <NavMenu blockId={id} disable={disable} />
        </div>

        {!!onResize && !disable?.resize && (
          <>
            <div
              className="absolute right-0 bottom-0 size-2 translate-x-1/2 translate-y-1/2 cursor-nwse-resize pointer-events-auto"
              onMouseDown={(e) => startResize(e, "se")}
            />
            {width >= 80 && height >= 40 && (
              <>
                <div
                  className="absolute left-0 top-0 size-2 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize pointer-events-auto"
                  onMouseDown={(e) => startResize(e, "nw")}
                />
                <div
                  className="absolute left-0 bottom-0 size-2 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize pointer-events-auto"
                  onMouseDown={(e) => startResize(e, "sw")}
                />
                <div
                  className="absolute right-0 top-0 size-2 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize pointer-events-auto"
                  onMouseDown={(e) => startResize(e, "ne")}
                />
                {height >= 60 && (
                  <>
                    <div
                      className="absolute left-0 right-0 h-1 top-0 -translate-y-1/2 cursor-ns-resize pointer-events-auto"
                      onMouseDown={(e) => startResize(e, "n")}
                    />
                    <div
                      className="absolute left-0 right-0 h-1 bottom-0  translate-y-1/2 cursor-ns-resize pointer-events-auto"
                      onMouseDown={(e) => startResize(e, "s")}
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 -translate-x-1/2 cursor-ew-resize pointer-events-auto"
                      onMouseDown={(e) => startResize(e, "w")}
                    />
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 translate-x-1/2 cursor-ew-resize pointer-events-auto"
                      onMouseDown={(e) => startResize(e, "e")}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  },
);
