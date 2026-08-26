"use client";

import {
  BlockFilterRule,
  EditorBlock,
  EditorChildren,
  useBlockChildrenBlockIds,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { useAccordion } from "../accordion/context";
import { ItemIcon } from "./icon";
import { AccordionItemProps } from "./schema";
import { styles } from "./styles";

const disable = {
  disableMove: true,
  disableDelete: true,
  disableClone: true,
  disableDrag: true,
};

const allowOnly: BlockFilterRule = {
  capabilities: ["inline"],
};

export const AccordionItemEditor = ({ props, style }: AccordionItemProps) => {
  const currentBlock = useCurrentBlock<AccordionItemProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const accordion = useAccordion();

  const titleId = useBlockChildrenBlockIds(currentBlock.id, "props.title")?.[0];
  const className = useClassName();
  const base = currentBlock.base;

  const animation = accordion?.animation ?? "slide";
  const iconPosition = accordion?.iconPosition ?? "right";
  const iconStyle = accordion?.iconStyle ?? "chevron";
  const isOpen =
    accordion?.isItemOpen(currentBlock.id) ??
    currentBlock.data?.props?.isOpen ??
    false;

  const toggleAccordion = () => {
    accordion?.onToggleItem(currentBlock.id);
  };

  const getAnimationClasses = () => {
    if (animation === "fade") {
      return isOpen
        ? "opacity-100 max-h-screen transition-all duration-300 ease-in-out"
        : "opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out";
    } else if (animation === "slide") {
      return isOpen
        ? "max-h-screen opacity-100 transition-all duration-300 ease-in-out"
        : "max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out";
    }
    return isOpen ? "block" : "hidden";
  };

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <div
        className={cn("border rounded-lg", className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <div
          className={cn(
            "p-4 cursor-pointer hover:bg-secondary hover:text-secondary-foreground flex items-center justify-between",
            isOpen && "border-b",
          )}
          onClick={toggleAccordion}
        >
          <div className="flex-1">
            {!!titleId && (
              <EditorBlock
                blockId={titleId}
                {...disable}
                index={0}
                parentBlockId={currentBlock.id}
                parentProperty="title"
                allow={allowOnly}
              />
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center",
              iconPosition === "left" ? "order-first mr-3" : "ml-3",
            )}
          >
            <ItemIcon
              iconStyle={iconStyle}
              isOpen={isOpen}
              className="transition-transform duration-200"
            />
          </div>
        </div>
        <div className={getAnimationClasses()}>
          <div className="p-4">
            <EditorChildren
              blockId={currentBlock.id}
              property="props.content"
            />
          </div>
        </div>
      </div>
    </>
  );
};
