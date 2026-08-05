"use client";

import { useI18n } from "@hacado/i18n/client";
import { MEMBER_STATUSES, USER_ROLES } from "@hacado/types";
import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
} from "@hacado/ui-admin";
import { useTeamMembersTableFilters } from "./use-table-filters";

export function TeamMembersTableAction() {
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

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
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
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
    </div>
  );
}
