import { cn } from "@hacado/ui";
import { ArrowRight, ChevronRight, Minus, Plus } from "lucide-react";
import { AccordionProps } from "../accordion/schema";

export const ItemIcon = ({
  iconStyle,
  isOpen,
  className,
}: {
  iconStyle: NonNullable<AccordionProps["props"]["iconStyle"]>;
  isOpen: boolean;
  className?: string;
}) => {
  if (iconStyle === "plus") {
    return isOpen ? (
      <Minus className={cn("h-5 w-5", className)} />
    ) : (
      <Plus className={cn("h-5 w-5", className)} />
    );
  } else if (iconStyle === "plus-x") {
    return <Plus className={cn("h-5 w-5", className, isOpen && "rotate-45")} />;
  } else if (iconStyle === "arrow") {
    return (
      <ArrowRight
        className={cn("h-5 w-5", className, !isOpen ? "rotate-0" : "rotate-90")}
      />
    );
  } else {
    return (
      <ChevronRight
        className={cn("h-5 w-5", className, !isOpen ? "rotate-0" : "rotate-90")}
      />
    );
  }
};
