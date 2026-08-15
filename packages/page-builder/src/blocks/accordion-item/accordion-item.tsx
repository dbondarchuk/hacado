"use client";

import { cn } from "@hacado/ui";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import React, { useState } from "react";
import { AccordionProps } from "../accordion/schema";

type AccordionItemInternalProps = {
  title: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  animation?: AccordionProps["props"]["animation"];
  iconPosition?: AccordionProps["props"]["iconPosition"];
  iconStyle?: AccordionProps["props"]["iconStyle"];
};

export const AccordionItemInternal: React.FC<AccordionItemInternalProps> = ({
  title,
  content,
  isOpen: propsIsOpen,
  animation = "slide",
  iconPosition = "right",
  iconStyle = "chevron",
}: AccordionItemInternalProps) => {
  const [isOpen, setIsOpen] = useState(propsIsOpen);

  // Get the appropriate icon based on iconStyle and state
  const getIcon = () => {
    if (iconStyle === "plus") {
      return isOpen ? (
        <Minus className="h-5 w-5" />
      ) : (
        <Plus className="h-5 w-5" />
      );
    } else if (iconStyle === "arrow") {
      return isOpen ? (
        <ArrowDown className="h-5 w-5" />
      ) : (
        <ArrowRight className="h-5 w-5" />
      );
    } else {
      // chevron (default)
      return isOpen ? (
        <ChevronDown className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
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

  return (
    <>
      <button
        className={cn(
          "w-full p-4 flex items-center justify-between transition-colors hover:bg-secondary hover:text-secondary-foreground cursor-pointer",
          isOpen && "border-b",
        )}
        onClick={() => setIsOpen(!isOpen)}
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
              "flex items-center justify-center transition-transform duration-200",
              iconPosition === "left" ? "mr-3" : "ml-3",
            )}
          >
            {getIcon()}
          </div>
        </div>
      </button>
      <div className={getAnimationClasses()}>
        <div className="p-4">{content}</div>
      </div>
    </>
  );
};
