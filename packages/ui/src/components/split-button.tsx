import { CaretDownIcon } from "@radix-ui/react-icons";
import React from "react";
import { cn } from "../utils";
import { Button, ButtonProps } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";

export type SplitButtonProps = ButtonProps & {
  caretClassName?: string;
  dropdownChildren: React.ReactNode | React.ReactNode[];
};

export const SplitButton: React.FC<SplitButtonProps> = ({
  variant,
  size,
  className,
  caretClassName,
  dropdownChildren,
  ...props
}) => (
  <div className="inline-flex items-stretch">
    <Button
      variant={variant}
      size={size}
      className={cn("rounded-r-none", className)}
      {...props}
    />
    <Separator orientation="vertical" className="self-stretch h-auto" />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label="More options"
          className={cn(
            "rounded-l-none border-l-0 px-2 self-stretch h-auto",
            caretClassName,
          )}
        >
          <CaretDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{dropdownChildren}</DropdownMenuContent>
    </DropdownMenu>
  </div>
);
