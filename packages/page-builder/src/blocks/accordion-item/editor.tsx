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
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useState } from "react";
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

export const AccordionItemEditor = ({
  props,
  style,
  ...additionalProps
}: AccordionItemProps & {
  animation?: "slide" | "fade" | "none";
  iconPosition?: "left" | "right";
  iconStyle?: "plus" | "arrow" | "chevron";
}) => {
  const currentBlock = useCurrentBlock<AccordionItemProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const titleId = useBlockChildrenBlockIds(currentBlock.id, "props.title")?.[0];
  const className = useClassName();
  const base = currentBlock.base;

  // Extract animation properties from additionalProps
  const animation = additionalProps.animation ?? "slide";
  const iconPosition = additionalProps.iconPosition ?? "right";
  const iconStyle = additionalProps.iconStyle ?? "chevron";

  // Use local state for accordion item open/close
  const [isOpen, setIsOpen] = useState(
    currentBlock.data?.props?.isOpen ?? false,
  );

  // Get the appropriate icon based on iconStyle and state
  const getIcon = () => {
    if (iconStyle === "plus") {
      return isOpen ? (
        <Minus className="w-4 h-4" />
      ) : (
        <Plus className="w-4 h-4" />
      );
    } else if (iconStyle === "arrow") {
      return isOpen ? (
        <ArrowDown className="w-4 h-4" />
      ) : (
        <ArrowRight className="w-4 h-4" />
      );
    } else {
      // chevron (default)
      return isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      );
    }
  };

  // Get animation classes based on animation type
  const getAnimationClasses = () => {
    if (animation === "fade") {
      return isOpen
        ? "opacity-100 max-h-screen transition-all duration-300 ease-in-out"
        : "opacity-0 max-h-0 overflow-hidden transition-all duration-300 ease-in-out";
    } else if (animation === "slide") {
      return isOpen
        ? "max-h-screen opacity-100 transition-all duration-300 ease-in-out"
        : "max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out";
    } else {
      // none
      return isOpen ? "block" : "hidden";
    }
  };

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
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
              "flex items-center justify-center transition-transform duration-200",
              iconPosition === "left" ? "order-first mr-3" : "ml-3",
            )}
          >
            {getIcon()}
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
