"use client";

import { useI18n } from "@hacado/i18n/client";
import { MEMBER_STATUSES, USER_ROLES } from "@hacado/types/users";

import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
} from "@hacado/ui-admin/data-table";
import React from "react";

import { useTeamMembersTableFilters } from "./use-table-filters";

export function TeamMembersTableAction({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const t = useI18n("admin");
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useTeamMembersTableFilters();

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="role"
        title={t("team.table.columns.role")}
        options={USER_ROLES.map((role) => ({
          value: role,
          label: t(`roles.${role}`),
        }))}
        setFilterValue={setRoleFilter as any}
        filterValue={roleFilter ?? []}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("team.table.columns.status")}
        options={MEMBER_STATUSES.map((status) => ({
          value: status,
          label:
            status === "active"
              ? t("team.table.status.active")
              : t("team.inactive"),
        }))}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter}
      />
      <DataTableRangeBox
        title={t("team.table.columns.joinedAt")}
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
    </>
  );

  return (
    <DataTableToolbar actions={actions}>
      <DataTableSearch
        searchKey="name"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setPage={setPage}
      />
      <ResponsiveFilterBar>{additionalFilters}</ResponsiveFilterBar>
      <DataTableResetFilter
        isFilterActive={isAnyFilterActive}
        onReset={resetFilters}
      />
    </DataTableToolbar>
  );
}
