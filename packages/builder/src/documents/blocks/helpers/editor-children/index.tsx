"use client";

import { Fragment, memo, useEffect, useMemo } from "react";

import { EditorBlock, useIsCurrentBlockOverlay } from "../../../editor/block";
import { TEditorBlock } from "../../../editor/core";

import { useDroppable } from "@dnd-kit/react";
import { cn, deepMemo } from "@hacado/ui";
import { DndContext } from "../../../../types/dndContext";
import {
  useBlockChildrenBlockIds,
  useBlockDepth,
  useBlocksDefinitions,
  useHasActiveDragBlock,
  useSetAllowedRule,
} from "../../../editor/context";
import {
  BaseZodDictionary,
  BlockFilterRule,
  BlockFilterRuleResult,
} from "../../../types";
import { matchesRule } from "../../../utils";
import { OverlayBlock } from "./overlay-block";

export type EditorChildrenChange = {
  blockId: string;
  block: TEditorBlock;
  children: TEditorBlock[];
};

const Placeholder = ({
  blockId,
  property,
  index,
  depth,
  allow,
}: {
  blockId: string;
  property: string;
  index: number;
  depth: number;
  allow?: BlockFilterRuleResult;
}) => {
  const hasActiveDragBlock = useHasActiveDragBlock();
  const isOverlay = useIsCurrentBlockOverlay();
  const blocksDefinitions = useBlocksDefinitions();
  const { ref } = useDroppable({
    id: `${blockId}/${property}/${index}-placeholder`,
    collisionPriority: depth,
    accept: (draggable) => {
      if (!draggable.type) return false;
      const type = draggable.type as string;
      const blockDefinition = blocksDefinitions.find((b) => b.type === type);
      if (allow && blockDefinition && !matchesRule(blockDefinition, allow))
        return false;
      return true;
    },
    disabled: isOverlay,
    data: {
      context: {
        parentBlockId: blockId,
        parentProperty: property,
        index,
        type: "",
      } satisfies DndContext,
    },
  });

  return (
    <div
      ref={ref}
      className={cn(
        "w-full min-h-10 min-w-10 border-2 border-dashed border-blue-400 bg-blue-400/20",
        hasActiveDragBlock && "bg-blue-400/60",
      )}
    >
      <OverlayBlock blockId={blockId} property={property} index={index} />
      <OverlayBlock blockId={blockId} property={property} index={index + 1} />
    </div>
  );
};

export type EditorChildrenProps<T extends BaseZodDictionary = any> = {
  blockId: string;
  property: string;
  allow?: BlockFilterRule;
  style?: React.CSSProperties;
  childWrapper?: (props: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    ref?: React.Ref<HTMLDivElement>;
    id?: string;
  }) => React.ReactNode;
  additionalProps?: Record<string, any>;
};

export const EditorChildren = memo(
  <T extends BaseZodDictionary = any>({
    property,
    blockId: currentBlockId,
    allow,
    childWrapper,
    additionalProps,
  }: EditorChildrenProps<T>) => {
    const depth = useBlockDepth(currentBlockId) ?? 0;

    const childrenIds = useBlockChildrenBlockIds(currentBlockId, property);

    return (
      <EditorChildrenRender
        childrenIds={childrenIds}
        childWrapper={childWrapper}
        additionalProps={additionalProps}
        currentBlockId={currentBlockId}
        property={property}
        depth={depth}
        allow={allow}
      />
    );
  },
);

const EditorChildrenRender = deepMemo(
  ({
    childrenIds,
    childWrapper,
    additionalProps,
    currentBlockId,
    property,
    depth,
    allow,
  }: {
    childrenIds?: string[];
    childWrapper?: React.ElementType;
    additionalProps?: Record<string, any>;
    currentBlockId: string;
    property: string;
    depth: number;
    allow?: BlockFilterRule;
  }) => {
    const ChildWrapper = useMemo(
      () => (childWrapper ?? Fragment) as React.ElementType,
      [childWrapper],
    );

    const setAllowedRule = useSetAllowedRule();
    const isCurrentOverlay = useIsCurrentBlockOverlay();

    useEffect(() => {
      if (isCurrentOverlay) return;
      setAllowedRule(currentBlockId, property, allow ?? {});
    }, [allow, currentBlockId, property, setAllowedRule, isCurrentOverlay]);

    return (
      <>
        {childrenIds
          ?.filter((blockId) => !!blockId)
          .map((childId, i) => (
            <Fragment key={childId}>
              <OverlayBlock
                blockId={currentBlockId}
                property={property}
                index={i}
              />
              <ChildWrapper>
                <EditorBlock
                  blockId={childId}
                  index={i}
                  parentBlockId={currentBlockId}
                  parentProperty={property}
                  additionalProps={additionalProps}
                  allow={allow}
                />
              </ChildWrapper>
            </Fragment>
          ))}
        {!childrenIds?.length ? (
          <Placeholder
            blockId={currentBlockId}
            property={property}
            index={0}
            depth={depth + 1}
            allow={allow}
          />
        ) : (
          <OverlayBlock
            blockId={currentBlockId}
            property={property}
            index={childrenIds.length}
          />
        )}
      </>
    );
  },
);
