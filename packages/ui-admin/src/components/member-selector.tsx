"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { TeamMemberListModel } from "@timelish/types";
import { cn, ComboboxAsync, IComboboxItem, Skeleton } from "@timelish/ui";
import React from "react";

const MemberShortLabel: React.FC<{
  member: TeamMemberListModel;
  row?: boolean;
}> = ({ member, row }) => {
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]">
      <img
        src={member.image ?? "/unknown-person.png"}
        alt={member.name}
        className="w-5 h-5 object-cover rounded-full"
      />
      <div className={cn("flex gap-0.5", row ? "items-baseline" : "flex-col")}>
        <span className="text-sm font-medium truncate">{member.name}</span>
        {member.email ? (
          <span className="text-xs italic truncate">{member.email}</span>
        ) : null}
      </div>
    </div>
  );
};

const MemberLoader: React.FC = () => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6 w-full">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="flex gap-0.5 flex-col w-full">
        <Skeleton className="min-w-40 max-w-96 w-full h-5" />
        <Skeleton className="min-w-36 max-w-80 w-full h-4" />
      </div>
    </div>
  );
};

type BaseMemberSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  excludeIds?: string[];
  placeholder?: string;
  /** When false (e.g. staff role), renders a locked read-only display. */
  canAssign?: boolean;
  onValueChange?: (member?: TeamMemberListModel) => void;
};

type ClearableMemberSelectorProps = BaseMemberSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableMemberSelectorProps = BaseMemberSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type MemberSelectorProps =
  | NonClearableMemberSelectorProps
  | ClearableMemberSelectorProps;

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
  excludeIds,
  placeholder,
  canAssign = true,
}) => {
  const t = useI18n("admin");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, TeamMemberListModel>
  >({});

  const getMembers = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.teams.getMembers({
        page,
        limit,
        search,
        status: ["active"],
        priorityId: value ? [value] : undefined,
      });

      const filtered = excludeIds?.length
        ? result.items.filter((member) => !excludeIds.includes(member._id))
        : result.items;

      setItemsCache((prev) => ({
        ...prev,
        ...filtered.reduce(
          (map, cur) => ({
            ...map,
            [cur._id]: cur,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: filtered.map((member) => ({
          label: <MemberShortLabel member={member} />,
          shortLabel: <MemberShortLabel member={member} row />,
          value: member._id,
        })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [value, excludeIds],
  );

  React.useEffect(() => {
    if (!value || itemsCache[value]) return;
    let cancelled = false;
    void (async () => {
      const result = await adminApi.teams.getMembers({
        page: 1,
        limit: 1,
        priorityId: [value],
        status: ["active"],
      });
      if (cancelled || !result.items[0]) return;
      const member = result.items[0];
      setItemsCache((prev) => ({
        ...prev,
        [member._id]: member,
      }));
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit itemsCache: only refetch when value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache]);

  if (!canAssign) {
    const selectedMember = value ? itemsCache[value] : undefined;
    return (
      <div
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground",
          className,
        )}
      >
        {selectedMember ? (
          <MemberShortLabel member={selectedMember} row />
        ) : value ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          t("memberSelector.unassigned")
        )}
      </div>
    );
  }

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full min-w-0", className)}
      placeholder={placeholder ?? t("memberSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getMembers}
      loader={<MemberLoader />}
    />
  );
};
