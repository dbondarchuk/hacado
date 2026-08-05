"use client";

import {
  BlockFilterRule,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useMemo } from "react";
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

  // Pass animation properties to accordion items
  const additionalProps = useMemo(
    () => ({
      animation,
      iconPosition,
      iconStyle,
    }),
    [animation, iconPosition, iconStyle],
  );

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <EditorChildren
          blockId={currentBlock.id}
          property="props"
          allow={allowOnly}
          additionalProps={additionalProps}
        />
      </div>
    </>
  );
};
