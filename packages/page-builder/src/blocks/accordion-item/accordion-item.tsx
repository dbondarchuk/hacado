"use client";

import { cn } from "@hacado/ui";
import React from "react";
import { useAccordion } from "../accordion/context";
import { ItemIcon } from "./icon";

type AccordionItemInternalProps = {
  title: React.ReactNode;
  content: React.ReactNode;
  itemId: string;
};

export const AccordionItemInternal: React.FC<AccordionItemInternalProps> = ({
  title,
  content,
  itemId,
}: AccordionItemInternalProps) => {
  const accordion = useAccordion();
  const isOpen = accordion?.isItemOpen(itemId) ?? false;
  const animation = accordion?.animation ?? "slide";
  const iconPosition = accordion?.iconPosition ?? "right";
  const iconStyle = accordion?.iconStyle ?? "chevron";

  const onToggle = () => {
    accordion?.onToggleItem(itemId);
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
    } else {
      return isOpen ? "block" : "hidden";
    }
  };

  return (
    <>
      <button
        className={cn(
          "w-full p-4 flex items-center justify-between transition-colors hover:bg-secondary hover:text-secondary-foreground cursor-pointer",
          isOpen && "border-b",
        )}
        onClick={onToggle}
        type="button"
      >
        <div
          className={cn(
            "flex items-center justify-between w-full",
            iconPosition === "left" ? "flex-row-reverse" : "flex-row",
          )}
        >
          <div className="flex-1 text-left">{title}</div>
          <div
            className={cn(
              "flex items-center justify-center",
              iconPosition === "left" ? "mr-3" : "ml-3",
            )}
          >
            <ItemIcon
              iconStyle={iconStyle}
              isOpen={isOpen}
              className="transition-transform duration-200"
            />
          </div>
        </div>
      </button>
      <div className={getAnimationClasses()}>
        <div className="p-4">{content}</div>
      </div>
    </>
  );
};
