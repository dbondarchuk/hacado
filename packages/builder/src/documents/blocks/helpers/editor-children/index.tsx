"use client";

import { Fragment, memo, useEffect, useMemo } from "react";

import { EditorBlock, useIsCurrentBlockOverlay } from "../../../editor/block";
import { TEditorBlock } from "../../../editor/core";

import { useDroppable } from "@dnd-kit/react";
import { cn } from "@hacado/ui/cn";
import { deepMemo } from "@hacado/ui/utils";
import { useFluidDropCollisionPriority } from "../../../../builder/dnd/fluid-drop-collision";
import { DndContext } from "../../../../types/dndContext";
import {
  useBlockChildrenBlockIds,
  useBlockDepth,
  useBlockType,
  useBlocksDefinitions,
  useEnableModalsView,
  useHasActiveDragBlock,
  useIsModalBlockType,
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
  const collisionPriority = useFluidDropCollisionPriority(
    depth,
    "nested",
    blockId,
  );

  const { ref } = useDroppable({
    id: `${blockId}/${property}/${index}-placeholder`,
    collisionPriority,
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
        isInsertSlot: true,
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

const EditorChildSlot = memo(
  ({
    childId,
    index,
    currentBlockId,
    property,
    additionalProps,
    allow,
    ChildWrapper,
    hideModals,
  }: {
    childId: string;
    index: number;
    currentBlockId: string;
    property: string;
    additionalProps?: Record<string, any>;
    allow?: BlockFilterRule;
    ChildWrapper: React.ElementType;
    hideModals: boolean;
  }) => {
    const blockType = useBlockType(childId);
    const isModalBlock = useIsModalBlockType(blockType);

    if (hideModals && isModalBlock) {
      return null;
    }

    return (
      <Fragment>
        <OverlayBlock
          blockId={currentBlockId}
          property={property}
          index={index}
        />
        <ChildWrapper>
          <EditorBlock
            blockId={childId}
            index={index}
            parentBlockId={currentBlockId}
            parentProperty={property}
            additionalProps={additionalProps}
            allow={allow}
          />
        </ChildWrapper>
      </Fragment>
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
    const hideModals = useEnableModalsView();
    const effectiveAllow = useMemo((): BlockFilterRule | undefined => {
      if (!hideModals) return allow;

      return {
        ...allow,
        not: {
          ...allow?.not,
          type: [...(allow?.not?.type || []), "Popup", "StickyBanner"],
        },
      };
    }, [allow, hideModals]);

    useEffect(() => {
      if (isCurrentOverlay) return;

      setAllowedRule(currentBlockId, property, effectiveAllow ?? {});
    }, [
      effectiveAllow,
      currentBlockId,
      property,
      setAllowedRule,
      isCurrentOverlay,
    ]);

    return (
      <>
        {childrenIds
          ?.filter((blockId) => !!blockId)
          .map((childId, i) => (
            <EditorChildSlot
              key={childId}
              childId={childId}
              index={i}
              currentBlockId={currentBlockId}
              property={property}
              additionalProps={additionalProps}
              allow={effectiveAllow}
              ChildWrapper={ChildWrapper}
              hideModals={hideModals}
            />
          ))}
        {!childrenIds?.length ? (
          <Placeholder
            blockId={currentBlockId}
            property={property}
            index={0}
            depth={depth + 1}
            allow={effectiveAllow}
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
