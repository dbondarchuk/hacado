"use client";

import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useI18n } from "@timelish/i18n/client";
import {
  Badge,
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@timelish/ui";
import { CheckIcon } from "lucide-react";
import { Options } from "nuqs";
import React from "react";

interface FilterOption<T extends boolean | string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterBoxProps<T extends boolean | string> {
  filterKey: string;
  title: string;
  options: FilterOption<T>[];
  setFilterValue: (
    value: T[] | ((old: T[]) => T[] | null) | null,
    options?: Options | undefined,
  ) => Promise<URLSearchParams>;
  filterValue: T[];
}

export function DataTableFilterBox<T extends boolean | string>({
  filterKey,
  title,
  options,
  setFilterValue,
  filterValue,
}: FilterBoxProps<T>) {
  const t = useI18n("ui");
  const selectedValuesSet = React.useMemo(() => {
    if (!filterValue) return new Set<T>();
    return new Set(filterValue.filter((value) => value !== ""));
  }, [filterValue]);

  const handleSelect = (value: T) => {
    const newSet = new Set(selectedValuesSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterValue(newSet.size ? Array.from(newSet) : null);
  };

  const resetFilter = () => setFilterValue(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircledIcon className="mr-2 size-3.5" />
          {title}
          {selectedValuesSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValuesSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValuesSet.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {t("dataTable.selectedCount", {
                      selected: selectedValuesSet.size,
                    })}
                  </Badge>
                ) : (
                  Array.from(selectedValuesSet).map((value) => (
                    <Badge
                      variant="secondary"
                      key={value.toString()}
                      className="rounded-sm px-1 font-normal"
                    >
                      {options.find((option) => option.value === value)
                        ?.label || value}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value.toString()}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValuesSet.has(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  {option.icon && (
                    <option.icon
                      className="mr-2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedValuesSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={resetFilter}
                    className="justify-center text-center"
                  >
                    {t("dataTable.resetFilters")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
