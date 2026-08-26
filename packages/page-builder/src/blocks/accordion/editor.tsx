"use client";

import {
  BlockFilterRule,
  EditorChildren,
  useBlockChildrenBlockIds,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
import { AccordionProvider } from "./context";
import { getInitialOpenItemIds, type AccordionOpenChild } from "./open-state";
import { AccordionProps } from "./schema";
import { styles } from "./styles";

const allowOnly: BlockFilterRule = {
  capabilities: ["accordion-item"],
};

export const AccordionEditor = ({ props, style }: AccordionProps) => {
  const currentBlock = useCurrentBlock<AccordionProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock.base;

  const animation = currentBlock.data?.props?.animation;
  const iconPosition = currentBlock.data?.props?.iconPosition;
  const iconStyle = currentBlock.data?.props?.iconStyle;
  const allowMultipleOpen =
    currentBlock.data?.props?.allowMultipleOpen ?? false;
  const defaultOpenFirst = currentBlock.data?.props?.defaultOpenFirst ?? false;
  const childIds = useBlockChildrenBlockIds(currentBlock.id, "props");
  const children = (currentBlock.data?.props?.children ??
    []) as AccordionOpenChild[];

  const initialOpenItemIds = useMemo(
    () =>
      getInitialOpenItemIds(
        children.length ? children : childIds.map((id) => ({ id })),
        allowMultipleOpen,
        defaultOpenFirst,
      ),
    [allowMultipleOpen, childIds, children, defaultOpenFirst],
  );

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <AccordionProvider
        allowMultipleOpen={allowMultipleOpen}
        initialOpenItemIds={initialOpenItemIds}
        animation={animation}
        iconPosition={iconPosition}
        iconStyle={iconStyle}
      >
        <div
          className={cn(className, base?.className)}
          id={base?.id}
          {...overlayProps}
        >
          <EditorChildren
            blockId={currentBlock.id}
            property="props"
            allow={allowOnly}
          />
        </div>
      </AccordionProvider>
    </>
  );
};
