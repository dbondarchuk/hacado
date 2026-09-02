"use client";

import { useDroppable } from "@dnd-kit/react";
import { cn, deepMemo } from "@hacado/ui";
import { motion } from "framer-motion";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useFluidDropCollisionPriority } from "../../../../builder/dnd/fluid-drop-collision";
import { DndContext } from "../../../../types/dndContext";
import { EditorBlock, useIsCurrentBlockOverlay } from "../../../editor/block";
import {
  useBlockChildrenBlockIds,
  useBlockDepth,
  useBlocksDefinitions,
  useHasActiveDragBlock,
  useSelectedSlot,
  useSetAllowedRule,
  useSetSelectedBlockId,
  useSetSelectedSlot,
} from "../../../editor/context";
import {
  childrenPropertyToSlotKey,
  childrenPropertyToStyleProperty,
} from "../../../embedded-slot";
import { BlockFilterRule, BlockFilterRuleResult } from "../../../types";
import { matchesRule } from "../../../utils";
import {
  getDropTargetOrientation,
  LiveDropTarget,
} from "../editor-children/live-drop-target";
import { OverlayBlock } from "../editor-children/overlay-block";

const SlotPlaceholder = ({
  parentBlockId,
  childrenProperty,
  index,
  depth,
  allow,
}: {
  parentBlockId: string;
  childrenProperty: string;
  index: number;
  depth: number;
  allow?: BlockFilterRuleResult;
}) => {
  const hasActiveDragBlock = useHasActiveDragBlock();
  const isOverlay = useIsCurrentBlockOverlay();
  const blocksDefinitions = useBlocksDefinitions();
  const collisionPriority = useFluidDropCollisionPriority(
    depth,
    "nested",
    parentBlockId,
  );
  const { ref } = useDroppable({
    id: `${parentBlockId}/${childrenProperty}/${index}-placeholder`,
    collisionPriority,
    accept: (draggable) => {
      if (!draggable.type) return false;
      const type = draggable.type as string;
      const blockDefinition = blocksDefinitions.find((b) => b.type === type);
      if (allow && blockDefinition && !matchesRule(blockDefinition, allow)) {
        return false;
      }
      return true;
    },
    disabled: isOverlay,
    data: {
      context: {
        parentBlockId,
        parentProperty: childrenProperty,
        index,
        type: "",
        isInsertSlot: true,
      } satisfies DndContext,
    },
  });

  return (
    <div
      ref={ref as never}
      className={cn(
        "w-full min-h-10 min-w-10 border-2 border-dashed border-blue-400 bg-blue-400/20",
        hasActiveDragBlock && "bg-blue-400/60",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <OverlayBlock
        blockId={parentBlockId}
        property={childrenProperty}
        index={index}
      />
      <OverlayBlock
        blockId={parentBlockId}
        property={childrenProperty}
        index={index + 1}
      />
    </div>
  );
};

export type EditorEmbeddedSlotProps = {
  parentBlockId: string;
  childrenProperty: string;
  allow?: BlockFilterRule;
  maxChildren?: number;
  /** Optional stable key; derived from childrenProperty when omitted */
  slotKey?: string;
  className?: string;
  component?: ElementType;
  additionalProps?: Record<string, unknown>;
  /** Wraps slot children (e.g. table cell inner flex layer). */
  childrenInnerWrapper?: ElementType;
  childrenInnerClassName?: string;
  children?: ReactNode;
} & Record<string, unknown>;

export const EditorEmbeddedSlot = memo(
  ({
    parentBlockId,
    childrenProperty,
    allow,
    maxChildren,
    slotKey: slotKeyProp,
    className,
    component: Component = motion.div,
    additionalProps,
    childrenInnerWrapper: ChildrenInnerWrapper,
    childrenInnerClassName,
    children: chromeBefore,
    ...rest
  }: EditorEmbeddedSlotProps) => {
    const slotKey = slotKeyProp ?? childrenPropertyToSlotKey(childrenProperty);
    const depth = useBlockDepth(parentBlockId) ?? 0;
    const childrenIds = useBlockChildrenBlockIds(
      parentBlockId,
      childrenProperty,
    );
    const setAllowedRule = useSetAllowedRule();
    const setSelectedSlot = useSetSelectedSlot();
    const setSelectedBlockId = useSetSelectedBlockId();
    const isOverlay = useIsCurrentBlockOverlay();

    const allowResult: BlockFilterRuleResult | undefined = allow;

    useEffect(() => {
      if (isOverlay) return;
      setAllowedRule(parentBlockId, childrenProperty, allow ?? {});
    }, [allow, parentBlockId, childrenProperty, setAllowedRule, isOverlay]);

    const onSlotSurfaceClick = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation();
        setSelectedBlockId(null);
        setSelectedSlot({
          blockId: parentBlockId,
          slotKey,
          childrenProperty,
          styleProperty: childrenPropertyToStyleProperty(childrenProperty),
        });
      },
      [
        childrenProperty,
        parentBlockId,
        setSelectedBlockId,
        setSelectedSlot,
        slotKey,
      ],
    );

    const visibleChildIds = useMemo(() => {
      const ids = childrenIds?.filter(Boolean) ?? [];
      if (maxChildren === undefined) return ids;
      return ids.slice(0, maxChildren);
    }, [childrenIds, maxChildren]);

    const SlotTag = Component as ElementType;
    const slotChildren = (
      <EmbeddedSlotChildren
        parentBlockId={parentBlockId}
        childrenProperty={childrenProperty}
        childrenIds={visibleChildIds}
        depth={depth}
        allow={allowResult}
        maxChildren={maxChildren}
      />
    );

    return (
      <SlotTag
        className={cn("relative w-full", className)}
        onClick={onSlotSurfaceClick}
        {...rest}
        {...additionalProps}
      >
        {chromeBefore}
        {ChildrenInnerWrapper ? (
          <ChildrenInnerWrapper className={cn(childrenInnerClassName)}>
            {slotChildren}
          </ChildrenInnerWrapper>
        ) : (
          slotChildren
        )}
      </SlotTag>
    );
  },
);

const EmbeddedSlotChildren = deepMemo(
  ({
    parentBlockId,
    childrenProperty,
    childrenIds,
    depth,
    allow,
    maxChildren,
  }: {
    parentBlockId: string;
    childrenProperty: string;
    childrenIds: string[];
    depth: number;
    allow?: BlockFilterRuleResult;
    maxChildren?: number;
  }) => {
    const atCapacity =
      maxChildren !== undefined && childrenIds.length >= maxChildren;
    const orientation = getDropTargetOrientation(allow);

    return (
      <>
        {childrenIds.map((childId, i) => (
          <Fragment key={childId}>
            <LiveDropTarget
              blockId={parentBlockId}
              property={childrenProperty}
              index={i}
              depth={depth + 1}
              allow={allow}
              orientation={orientation}
            >
              <OverlayBlock
                blockId={parentBlockId}
                property={childrenProperty}
                index={i}
              />
            </LiveDropTarget>
            <EditorBlock
              blockId={childId}
              index={i}
              parentBlockId={parentBlockId}
              parentProperty={childrenProperty}
              allow={allow}
            />
          </Fragment>
        ))}
        {!childrenIds.length && !atCapacity ? (
          <SlotPlaceholder
            parentBlockId={parentBlockId}
            childrenProperty={childrenProperty}
            index={0}
            depth={depth + 1}
            allow={allow}
          />
        ) : !atCapacity ? (
          <LiveDropTarget
            blockId={parentBlockId}
            property={childrenProperty}
            index={childrenIds.length}
            depth={depth + 1}
            allow={allow}
            orientation={orientation}
          >
            <OverlayBlock
              blockId={parentBlockId}
              property={childrenProperty}
              index={childrenIds.length}
            />
          </LiveDropTarget>
        ) : null}
      </>
    );
  },
);

export function useIsSelectedEmbeddedSlot(
  parentBlockId: string,
  slotKey: string,
): boolean {
  const selected = useSelectedSlot();
  return selected?.blockId === parentBlockId && selected?.slotKey === slotKey;
}
