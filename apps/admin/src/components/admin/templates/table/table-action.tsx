"use client";

import { useCustomTextTemplatesAllowed } from "@/lib/sms/use-custom-text-templates";
import { useI18n } from "@hacado/i18n/client";
import { communicationChannels } from "@hacado/types/communication";

import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import React from "react";

import { DeleteSelectedTemplatesButton } from "./delete-selected";
import { useTemplatesTableFilters } from "./use-table-filters";

export function TemplatesTableAction({
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
    typeFilter,
    setTypeFilter,
  } = useTemplatesTableFilters();

  const { rowSelection } = useSelectedRowsStore();
  const allowTextTemplates = useCustomTextTemplatesAllowed();

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("templates.table.filters.type")}
        options={communicationChannels
          // .filter((channel) => allowTextTemplates || channel !== "text-message")
          .map((channel) => ({
            value: channel,
            label: t(`common.labels.channel.${channel}`),
          }))}
        setFilterValue={setTypeFilter as any}
        filterValue={typeFilter}
      />
    </>
  );

  return (
    <>
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
      <SelectionActionBar count={rowSelection.length}>
        <DeleteSelectedTemplatesButton selected={rowSelection} />
      </SelectionActionBar>
    </>
  );
}
