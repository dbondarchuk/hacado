"use client";

import { useI18n } from "@hacado/i18n/client";
import React from "react";
import { cn } from "../utils";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "./badge";
import { Button, ButtonProps } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange?: (value: string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: ButtonProps["size"];
}

function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder,
  disabled,
  size,
  ...props
}: MultiSelectProps) {
  const t = useI18n("ui");
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange?.(selected.filter((i) => i !== item));
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size}
          className={cn("w-full justify-between", className)}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.map((item) => (
              <Badge
                variant="secondary"
                key={item}
                className="mr-1"
                onClick={() => handleUnselect(item)}
              >
                {options.find((opt) => opt.value === item)?.label || item}
                <span
                  tabIndex={0}
                  className="cursor-pointer ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              </Badge>
            ))}
            {(!selected || !selected.length) && (
              <div className="text-sm text-muted-foreground font-normal">
                {placeholder || t("multiSelect.placeholder")}
              </div>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={"min-w-max p-0 w-[var(--radix-popper-anchor-width)]"}
      >
        <Command className={className}>
          <CommandInput placeholder={t("common.search")} />
          <CommandEmpty>{t("common.noResults")}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandList>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange?.(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value],
                    );
                    setOpen(true);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
