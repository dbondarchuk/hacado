"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type { TeamMemberListModel } from "@hacado/types";
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  useDebounce,
} from "@hacado/ui";
import { Check, Users } from "lucide-react";
import React from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export type MemberSelectorCompactProps = {
  value?: string;
  onItemSelect: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const MemberSelectorCompact: React.FC<MemberSelectorCompactProps> = ({
  value,
  onItemSelect,
  placeholder,
  className,
  disabled,
}) => {
  const t = useI18n("admin");
  const tUi = useI18n("ui");
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<TeamMemberListModel[]>([]);
  const [selected, setSelected] = React.useState<TeamMemberListModel | null>(
    null,
  );

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const allLabel = placeholder ?? t("calendar.allMembers");
  const { ref, inView } = useInView({ threshold: 0.5 });

  React.useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    if (selected?._id === value) return;

    const fromList = members.find((item) => item._id === value);
    if (fromList) {
      setSelected(fromList);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await adminApi.teams.getMembers({
        page: 1,
        limit: 1,
        priorityId: [value],
        status: ["active"],
      });
      if (cancelled || !result.items[0]) return;
      setSelected(result.items[0]);
    })();

    return () => {
      cancelled = true;
    };
  }, [value, members, selected?._id]);

  React.useEffect(() => {
    setMembers([]);
    setPage(1);
    setHasMore(true);
    setInitialLoad(true);
  }, [debouncedSearch]);

  React.useEffect(() => {
    if (!open) return;
    if (!hasMore && !initialLoad) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await adminApi.teams.getMembers({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          status: ["active"],
          priorityId: value ? [value] : undefined,
        });

        if (cancelled) return;

        setMembers((prev) =>
          page === 1 ? result.items : [...prev, ...result.items],
        );

        setHasMore(page * PAGE_SIZE < result.total);
        setInitialLoad(false);
      } catch {
        toast.error(tUi("common.requestFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, page, value, initialLoad, hasMore, tUi]);

  React.useEffect(() => {
    if (inView && !loading && hasMore && open) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore, open]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSearch("");
      setMembers([]);
      setPage(1);
      setHasMore(true);
      setInitialLoad(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("gap-2 rounded-full", className)}
          aria-label={selected?.name ?? allLabel}
        >
          {selected ? (
            <img
              src={selected.image ?? "/unknown-person.png"}
              alt=""
              className="size-5 rounded-full object-cover"
            />
          ) : (
            <Users className="size-4" strokeWidth={1.5} />
          )}
          <span className="hidden max-w-40 truncate xl:inline">
            {selected?.name ?? allLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={tUi("common.search")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && page === 1 ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : members.length === 0 && !loading && !!debouncedSearch ? (
              <CommandEmpty>{tUi("common.noResults")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {!debouncedSearch ? (
                  <CommandItem
                    value="__all__"
                    onSelect={() => {
                      onItemSelect(undefined);
                      setSelected(null);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        !value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Users className="mr-2 size-5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{allLabel}</span>
                  </CommandItem>
                ) : null}
                {members.map((item) => (
                  <CommandItem
                    key={item._id}
                    value={item._id}
                    onSelect={() => {
                      onItemSelect(item._id);
                      setSelected(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        value === item._id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <img
                      src={item.image ?? "/unknown-person.png"}
                      alt=""
                      className="mr-2 size-5 shrink-0 rounded-full object-cover"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>
                      {item.email ? (
                        <span className="truncate text-xs italic text-muted-foreground">
                          {item.email}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
                {loading && page > 1 ? (
                  <div className="p-2">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : null}
                {hasMore && !loading ? <div ref={ref} className="h-1" /> : null}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
