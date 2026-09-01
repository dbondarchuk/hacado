"use client";

import { useDragHandle } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { cn } from "@hacado/ui";
import {
  ArrowUpFromLine,
  BringToFront,
  Copy,
  GripHorizontal,
  GripVertical,
  RotateCcw,
  SendToBack,
  SquareArrowDown,
  SquareArrowUp,
  Trash,
  Undo2,
} from "lucide-react";
import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  Ref,
} from "react";
import { useCallback, useMemo } from "react";
import { useFluidLayout } from "./context";
import { FluidChromeTooltipButton } from "./fluid-chrome-tooltip-button";
import { FluidPlacement } from "./schema";
import {
  placementToGridStyle,
  placementToRotateStyle,
  ResizeHandle,
} from "./utils";

/** Keep selected child (and its chrome) above siblings and the grid overlay. */
const FLUID_SELECTED_Z_INDEX = 10_000;
const FLUID_CHROME_Z_INDEX = 10_001;

const HANDLES: { handle: ResizeHandle; className: string }[] = [
  {
    handle: "n",
    className:
      "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize",
  },
  {
    handle: "s",
    className:
      "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize",
  },
  {
    handle: "e",
    className:
      "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize",
  },
  {
    handle: "w",
    className:
      "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize",
  },
  {
    handle: "ne",
    className:
      "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize",
  },
  {
    handle: "nw",
    className:
      "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize",
  },
  {
    handle: "se",
    className:
      "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize",
  },
  {
    handle: "sw",
    className:
      "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize",
  },
];

type FluidChildChromeProps = {
  childId: string;
  placement: FluidPlacement;
  selected: boolean;
  children: ReactNode;
};

export const FluidChildChrome = ({
  childId,
  placement,
  selected,
  children,
}: FluidChildChromeProps) => {
  const t = useI18n("builder");
  const {
    beginMove,
    beginResize,
    beginRotate,
    resetRotation,
    resetChildPlacement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    cloneChild,
    deleteChild,
    moveOut,
    activeChildId,
    suppressParentSelection,
    isAltPressed,
    columnCount,
    hasChildOverride,
  } = useFluidLayout();

  const { handleRef: sortableHandleRef } = useDragHandle({ id: childId });

  const gridStyle = useMemo(() => {
    const style = placementToGridStyle(placement);
    if (selected) {
      return { ...style, zIndex: FLUID_SELECTED_Z_INDEX };
    }
    return style;
  }, [placement, selected]);
  const rotateStyle = useMemo(
    () => placementToRotateStyle(placement),
    [placement],
  );
  const isDragging = activeChildId === childId;
  const hasRotation = !!placement.rotate;

  const toolbarInside =
    placement.colStart === 1 && placement.colEnd >= columnCount + 1;
  const toolbarOnRight = !toolbarInside && placement.colStart === 1;

  const stopSelectParent = useCallback(
    (e: ReactMouseEvent | ReactPointerEvent) => {
      e.stopPropagation();
    },
    [],
  );

  const onToolbarAction = useCallback(
    (action: () => void) => (e: ReactMouseEvent) => {
      e.stopPropagation();
      suppressParentSelection();
      action();
    },
    [suppressParentSelection],
  );

  const startMove = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      beginMove(childId, e.clientX, e.clientY);
    },
    [beginMove, childId],
  );

  const startRotate = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const shell = (e.currentTarget as HTMLElement).closest(
        "[data-fluid-child]",
      );
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      beginRotate(
        childId,
        e.clientX,
        e.clientY,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    },
    [beginRotate, childId],
  );

  const onResizePointerDown = useCallback(
    (handle: ResizeHandle) => (e: ReactPointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      beginResize(childId, handle, e.clientX, e.clientY);
    },
    [beginResize, childId],
  );

  const rotateTitle = isAltPressed
    ? t("pageBuilder.blocks.fluidLayout.rotateFree")
    : t("pageBuilder.blocks.fluidLayout.rotate");

  return (
    <div
      data-fluid-child={childId}
      className={cn(
        "relative min-h-0 min-w-0",
        !selected && "z-10",
        selected && "ring-2 ring-blue-500 ring-offset-1",
        isDragging && "opacity-80",
      )}
      style={gridStyle}
      onClick={stopSelectParent}
    >
      <div
        className="fluid-child-rotate relative h-full w-full min-h-0 min-w-0"
        style={rotateStyle}
      >
        {selected ? (
          <>
            <div
              className="pointer-events-none absolute -top-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
              style={{ zIndex: FLUID_CHROME_Z_INDEX }}
            >
              <FluidChromeTooltipButton
                tooltip={rotateTitle}
                tooltipSide="top"
                className={cn(
                  "pointer-events-auto size-3 cursor-grab rounded-full border-2 border-white bg-blue-500 touch-none hover:bg-blue-600 active:cursor-grabbing",
                  isAltPressed && "ring-2 ring-amber-400 ring-offset-1",
                )}
                aria-label={rotateTitle}
                onClick={stopSelectParent}
                onPointerDown={startRotate}
              >
                <span className="sr-only">{rotateTitle}</span>
              </FluidChromeTooltipButton>
              <div className="h-5 w-0.5 bg-blue-500" aria-hidden />
            </div>
            <div
              className={cn(
                "pointer-events-auto absolute top-0 flex flex-col items-center gap-1 px-1 py-0.5",
                toolbarInside && "left-0",
                toolbarOnRight && "left-full ml-1",
                !toolbarInside && !toolbarOnRight && "left-0 -translate-x-full",
              )}
              style={{ zIndex: FLUID_CHROME_Z_INDEX }}
              onClick={stopSelectParent}
              onPointerDown={stopSelectParent}
            >
              <FluidChromeTooltipButton
                className="flex cursor-grab items-center justify-center rounded-md border border-blue-400 bg-white p-1.5 text-blue-700 shadow-sm hover:bg-blue-50 active:cursor-grabbing"
                tooltip={t("pageBuilder.blocks.fluidLayout.move")}
                onPointerDown={startMove}
              >
                <GripVertical className="size-4" />
              </FluidChromeTooltipButton>
              <FluidChromeTooltipButton
                className="flex cursor-grab items-center justify-center rounded-md border border-blue-400 bg-white p-1.5 text-blue-700 shadow-sm hover:bg-blue-50 active:cursor-grabbing"
                tooltip={t("pageBuilder.blocks.fluidLayout.sortableDrag")}
                ref={sortableHandleRef as Ref<HTMLButtonElement>}
                onClick={stopSelectParent}
                onPointerDown={stopSelectParent}
              >
                <GripHorizontal className="size-3.5" />
              </FluidChromeTooltipButton>
              <FluidChromeTooltipButton
                className="flex cursor-pointer items-center justify-center rounded-md border border-blue-400 bg-white p-1.5 text-blue-700 shadow-sm hover:bg-blue-50"
                tooltip={t("pageBuilder.blocks.fluidLayout.moveOut")}
                onClick={onToolbarAction(() => moveOut(childId))}
              >
                <ArrowUpFromLine className="size-3.5" />
              </FluidChromeTooltipButton>
              <div className="flex flex-col gap-1 rounded-md border border-blue-400 bg-white p-0.5 shadow-sm">
                <FluidChromeTooltipButton
                  className="flex cursor-pointer items-center justify-center rounded p-1.5 text-blue-700 hover:bg-blue-50"
                  tooltip={t("pageBuilder.blocks.fluidLayout.clone")}
                  onClick={onToolbarAction(() => cloneChild(childId))}
                >
                  <Copy className="size-3.5" />
                </FluidChromeTooltipButton>
                <FluidChromeTooltipButton
                  className="flex cursor-pointer items-center justify-center rounded p-1.5 text-red-600 hover:bg-red-50"
                  tooltip={t("pageBuilder.blocks.fluidLayout.delete")}
                  onClick={onToolbarAction(() => deleteChild(childId))}
                >
                  <Trash className="size-3.5" />
                </FluidChromeTooltipButton>
              </div>
              {hasChildOverride(childId) ? (
                <FluidChromeTooltipButton
                  className="flex cursor-pointer items-center justify-center rounded-md border border-blue-400 bg-white p-1.5 text-blue-700 shadow-sm hover:bg-blue-50"
                  tooltip={t(
                    "pageBuilder.blocks.fluidLayout.chrome.resetPosition",
                  )}
                  onClick={onToolbarAction(() => resetChildPlacement(childId))}
                >
                  <Undo2 className="size-3.5" />
                </FluidChromeTooltipButton>
              ) : null}
              {hasRotation ? (
                <FluidChromeTooltipButton
                  className="flex cursor-pointer items-center justify-center rounded-md border border-blue-400 bg-white p-1.5 text-blue-700 shadow-sm hover:bg-blue-50"
                  tooltip={t("pageBuilder.blocks.fluidLayout.resetRotate")}
                  onClick={onToolbarAction(() => resetRotation(childId))}
                >
                  <RotateCcw className="size-3.5" />
                </FluidChromeTooltipButton>
              ) : null}
              <div className="flex flex-col rounded-md border border-blue-400 bg-white p-0.5 shadow-sm">
                <FluidChromeTooltipButton
                  className="rounded p-1 text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                  tooltip={t(
                    "pageBuilder.blocks.fluidLayout.zOrder.bringForward",
                  )}
                  onClick={onToolbarAction(() => bringForward(childId))}
                >
                  <SquareArrowUp className="size-3.5" />
                </FluidChromeTooltipButton>
                <FluidChromeTooltipButton
                  className="rounded p-1 text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                  tooltip={t(
                    "pageBuilder.blocks.fluidLayout.zOrder.sendBackward",
                  )}
                  onClick={onToolbarAction(() => sendBackward(childId))}
                >
                  <SquareArrowDown className="size-3.5" />
                </FluidChromeTooltipButton>
                <FluidChromeTooltipButton
                  className="rounded p-1 text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                  tooltip={t(
                    "pageBuilder.blocks.fluidLayout.zOrder.bringToFront",
                  )}
                  onClick={onToolbarAction(() => bringToFront(childId))}
                >
                  <BringToFront className="size-3.5" />
                </FluidChromeTooltipButton>
                <FluidChromeTooltipButton
                  className="rounded p-1 text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
                  tooltip={t(
                    "pageBuilder.blocks.fluidLayout.zOrder.sendToBack",
                  )}
                  onClick={onToolbarAction(() => sendToBack(childId))}
                >
                  <SendToBack className="size-3.5" />
                </FluidChromeTooltipButton>
              </div>
            </div>
            {HANDLES.map(({ handle, className }) => (
              <div
                key={handle}
                className={cn(
                  "pointer-events-auto absolute size-2.5 rounded-sm border border-white bg-blue-500",
                  className,
                )}
                style={{ zIndex: FLUID_CHROME_Z_INDEX }}
                onClick={stopSelectParent}
                onPointerDown={onResizePointerDown(handle)}
              />
            ))}
          </>
        ) : null}
        <div className="fluid-child-content h-full w-full min-h-0 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};
