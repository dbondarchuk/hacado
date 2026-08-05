"use client";

import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useI18n } from "@hacado/i18n/client";
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
  Spinner,
  toast,
  useDebounce,
} from "@hacado/ui";
import { CheckIcon } from "lucide-react";
import { Options } from "nuqs";
import React from "react";
import { useInView } from "react-intersection-observer";

export interface AsyncFilterBoxOption {
  value: string;
  label: React.ReactNode;
  shortLabel: React.ReactNode;
}

export interface AsyncFilterBoxProps {
  filterKey: string;
  title: string;
  emptyMessage?: string;
  setFilterValue: (
    value: string[] | ((old: string[] | null) => string[] | null) | null,
    options?: Options | undefined,
  ) => Promise<URLSearchParams>;
  filterValue: string[] | null;
  fetchItems: (
    page: number,
    search?: string,
  ) => Promise<{
    items: AsyncFilterBoxOption[];
    hasMore: boolean;
    preselected?: AsyncFilterBoxOption[];
  }>;
  debounceMs?: number;
  maxAmount?: number;
  loader?: React.ReactNode;
}

export function DataTableAsyncFilterBox({
  filterKey,
  title,
  fetchItems,
  setFilterValue,
  filterValue,
  emptyMessage = "No items found.",
  debounceMs = 300,
  maxAmount = 5,
  loader = <Spinner />,
}: AsyncFilterBoxProps) {
  const t = useI18n("ui");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, AsyncFilterBoxOption>
  >({});

  const [items, setItems] = React.useState<AsyncFilterBoxOption[]>([]);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, debounceMs);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const selectedValuesSet = React.useMemo(() => {
    if (!filterValue) return new Set<string>();
    return new Set(filterValue.filter((value) => value !== ""));
  }, [filterValue]);

  React.useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch, selectedValuesSet]);

  const handleSelect = (value: string) => {
    const newSet = new Set(selectedValuesSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterValue(newSet.size ? Array.from(newSet) : null);
  };

  const resetFilter = () => setFilterValue(null);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await fetchItems(page, debouncedSearch);

        if (page === 1) {
          setItems(result.items);
        } else {
          setItems((prev) => [...prev, ...result.items]);
        }

        const newItemCache: typeof itemsCache = {};
        for (const item of result.items) {
          newItemCache[item.value] = item;
        }

        setItemsCache((prev) => ({
          ...prev,
          ...newItemCache,
        }));

        setHasMore(result.hasMore);
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error(t("common.requestFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [debouncedSearch, page, fetchItems, initialLoad, hasMore]);

  // Load more when scrolled to bottom
  React.useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore]);

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
                  Array.from(selectedValuesSet).map((value) => {
                    const item =
                      items.find((item) => item.value === value) ??
                      itemsCache[value];
                    return (
                      <Badge
                        variant="secondary"
                        key={value.toString()}
                        className="rounded-sm px-1 font-normal"
                      >
                        {item?.shortLabel ?? item?.shortLabel ?? value}
                      </Badge>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={title}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && page === 1 ? (
              <div className="flex items-center justify-center py-6">
                {loader}
              </div>
            ) : items.length === 0 && !loading ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => {
                  const disabled =
                    selectedValuesSet.size >= maxAmount &&
                    !selectedValuesSet.has(item.value);

                  return (
                    <CommandItem
                      key={item.value}
                      onSelect={() => handleSelect(item.value)}
                      disabled={disabled}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedValuesSet.has(item.value)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {loading && page > 1 && (
              <div className="flex items-center justify-center py-2">
                {loader}
              </div>
            )}
            {/* Invisible element for intersection observer */}
            {hasMore && !loading && <div ref={ref} className="h-1" />}
          </CommandList>
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
