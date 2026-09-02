"use client";

import { pointerIntersection } from "@dnd-kit/collision";
import { useDroppable } from "@dnd-kit/react";
import { cn } from "@hacado/ui";
import { memo, type ReactNode } from "react";
import { useFluidDropCollisionPriority } from "../../../../builder/dnd/fluid-drop-collision";
import { DndContext } from "../../../../types/dndContext";
import { useIsCurrentBlockOverlay } from "../../../editor/block";
import {
  useActiveDragBlock,
  useBlockDefinition,
  useBlocksDefinitions,
  useHasActiveDragBlock,
  useIsActiveOverDroppable,
} from "../../../editor/context";
import { BlockFilterRuleResult } from "../../../types";
import { matchesRule } from "../../../utils";

export type DropTargetOrientation = "vertical" | "horizontal";

export function getDropTargetOrientation(
  allow?: BlockFilterRuleResult,
): DropTargetOrientation {
  if (
    allow &&
    allow !== "impossible" &&
    allow.capabilities?.includes("inline")
  ) {
    return "horizontal";
  }
  return "vertical";
}

const INSERT_SLOT_PRIORITY_BOOST = 1;

type LiveDropTargetProps = {
  blockId: string;
  property: string;
  index: number;
  depth: number;
  allow?: BlockFilterRuleResult;
  orientation?: DropTargetOrientation;
  children?: ReactNode;
};

export const LiveDropTarget = memo(
  ({
    blockId,
    property,
    index,
    depth,
    allow,
    orientation = "vertical",
    children,
  }: LiveDropTargetProps) => {
    const hasActiveDragBlock = useHasActiveDragBlock();
    const isOverlay = useIsCurrentBlockOverlay();
    const activeDrag = useActiveDragBlock();
    const isActiveOver = useIsActiveOverDroppable(blockId, property, index);
    const blocksDefinitions = useBlocksDefinitions();
    const parentBlockDefinition = useBlockDefinition(blockId);
    const collisionPriority =
      useFluidDropCollisionPriority(depth, "nested", blockId) +
      INSERT_SLOT_PRIORITY_BOOST;
    const isInline = orientation === "horizontal";
    const dragType = activeDrag?.block.type;

    const isNoOpSlot =
      !!activeDrag &&
      !activeDrag.isTemplate &&
      activeDrag.parentBlockId === blockId &&
      activeDrag.parentProperty === property &&
      activeDrag.index === index;

    const canAcceptDrag = (() => {
      if (!dragType) return false;
      const blockDefinition = blocksDefinitions.find(
        (b) => b.type === dragType,
      );
      if (allow === "impossible") return false;
      if (allow && blockDefinition && !matchesRule(blockDefinition, allow)) {
        return false;
      }
      if (
        blockDefinition?.allowedIn &&
        parentBlockDefinition &&
        !matchesRule(parentBlockDefinition, blockDefinition.allowedIn)
      ) {
        return false;
      }
      return true;
    })();

    const { ref, isDropTarget } = useDroppable({
      id: `${blockId}/${property}/${index}-insert`,
      collisionDetector: pointerIntersection,
      collisionPriority,
      accept: (draggable) => {
        if (!draggable.type) return false;
        const type = draggable.type as string;
        const blockDefinition = blocksDefinitions.find((b) => b.type === type);
        if (allow === "impossible") return false;
        if (allow && blockDefinition && !matchesRule(blockDefinition, allow)) {
          return false;
        }
        if (
          blockDefinition?.allowedIn &&
          parentBlockDefinition &&
          !matchesRule(parentBlockDefinition, blockDefinition.allowedIn)
        ) {
          return false;
        }
        return true;
      },
      disabled:
        isOverlay || !hasActiveDragBlock || isNoOpSlot || !canAcceptDrag,
      data: {
        context: {
          parentBlockId: blockId,
          parentProperty: property,
          index,
          type: "",
          isInsertSlot: true,
        } satisfies DndContext,
      },
    });

    if (!hasActiveDragBlock || isOverlay || isNoOpSlot || !canAcceptDrag) {
      return null;
    }

    const isActive = isDropTarget || isActiveOver;
    const Tag = isInline ? "span" : "div";

    return (
      <Tag
        ref={ref as never}
        className={cn(
          "relative z-20 flex shrink-0 items-center justify-center",
          isInline ? "self-stretch w-4" : "w-full min-h-4",
        )}
        data-insert-slot=""
        data-insert-index={index}
      >
        {!isActiveOver ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none rounded-full bg-blue-400/70 transition-[width,height,background-color,box-shadow]",
              isInline
                ? isActive
                  ? "h-[80%] w-1 bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.22)]"
                  : "h-[60%] w-0.5"
                : isActive
                  ? "h-1 w-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.22)]"
                  : "h-0.5 w-full",
            )}
          />
        ) : null}
        {children}
      </Tag>
    );
  },
);
