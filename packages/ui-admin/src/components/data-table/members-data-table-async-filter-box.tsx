"use client";

import React from "react";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { TeamMemberListModel } from "@hacado/types";
import { Skeleton, useDebounceCacheFn } from "@hacado/ui";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const MemberShortLabel: React.FC<{
  member: TeamMemberListModel;
}> = ({ member }) => {
  const name = member.name || member.email || member.userId;
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap">
      <img
        src={member.image ?? "/unknown-person.png"}
        width={20}
        height={20}
        alt={name}
        className="rounded-full object-cover"
      />
      <div className="flex gap-0.5 flex-col w-full overflow-hidden">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {name}
        </span>
        {member.name && member.email ? (
          <span className="text-xs italic overflow-hidden text-ellipsis whitespace-nowrap">
            {member.email}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const MemberLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="flex gap-0.5 flex-col">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-36 h-4" />
      </div>
    </div>
  );
};

export const MembersDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "member", ...rest }) => {
  const t = useI18n("admin");
  const title = propsTitle ?? t("appointments.table.filters.member");

  const getMembers = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.teams.getMembers({
        page,
        limit,
        search,
        status: ["active"],
        priorityId: rest.filterValue ?? undefined,
      });

      return {
        items: result.items.map((member) => ({
          label: <MemberShortLabel member={member} />,
          shortLabel: member.name || member.email || member.userId,
          value: member._id,
        })) satisfies AsyncFilterBoxOption[],
        hasMore: page * limit < result.total,
      };
    },
    100,
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={getMembers}
      {...rest}
      loader={<MemberLoader />}
    />
  );
};
