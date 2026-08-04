"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
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
} from "@timelish/ui";
import { Plus } from "lucide-react";
import React, { Fragment, useState } from "react";
import {
  BaseStyleDictionary,
  StyleCategory,
  StyleDefinition,
  StyleDictionary,
} from "../../style/types";

interface AddStyleButtonProps<T extends BaseStyleDictionary> {
  availableStyles: StyleDictionary<T>;
  onAddStyle: (style: StyleDefinition<T[keyof T]>) => void;
  category?: StyleCategory;
  children?: React.ReactNode;
}

export const AddStyleButton = <T extends BaseStyleDictionary>({
  availableStyles,
  onAddStyle,
  category: onlyCategory,
  children: trigger,
}: AddStyleButtonProps<T>) => {
  const t = useI18n();
  const tUi = useI18n("ui");
  const [open, setOpen] = useState(false);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost">
            <Plus size={16} /> {t("builder.pageBuilder.styles.addStyle")}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="sm:w-fit">
        <Command>
          <CommandInput
            placeholder={t("builder.pageBuilder.styles.searchStyles")}
          />
          <CommandList>
            <CommandEmpty>{tUi("common.noResults")}</CommandEmpty>
            {Object.entries(
              Object.entries(availableStyles).reduce(
                (map, [name, value]) => ({
                  ...map,
                  [value.category]: [
                    ...(map[value.category as StyleCategory] || []),
                    {
                      ...value,
                      name,
                    },
                  ],
                }),
                {} as Record<StyleCategory, StyleDefinition<T[keyof T]>[]>,
              ),
            )
              .filter(([category]) =>
                onlyCategory ? category === onlyCategory : true,
              )
              .map(([category, values], i, array) => (
                <Fragment key={category}>
                  <CommandGroup
                    heading={t(
                      `builder.pageBuilder.styles.categories.${category}`,
                    )}
                  >
                    {values.map((value) => (
                      <CommandItem
                        key={value.name}
                        className="cursor-pointer gap-2 [&>svg]:size-4"
                        onSelect={() => {
                          onAddStyle(value);
                          setOpen(false);
                        }}
                      >
                        {<value.icon className="size-3" />}{" "}
                        <span>
                          {t(value.label)}{" "}
                          <span className="hidden">{value.name}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {i < array.length - 1 && <CommandSeparator />}
                </Fragment>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
