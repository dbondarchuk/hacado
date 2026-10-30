"use client";

import { useCustomTextTemplatesAllowed } from "@/lib/sms/use-custom-text-templates";
import { useI18n } from "@hacado/i18n/client";
import { communicationChannels } from "@hacado/types/communication";

import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit";

import { DeleteSelectedTemplatesButton } from "./delete-selected";
import { useTemplatesTableFilters } from "./use-table-filters";

export function TemplatesTableAction() {
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
          .filter((channel) => allowTextTemplates || channel !== "text-message")
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
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
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
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <DeleteSelectedTemplatesButton selected={rowSelection} />
      </div>
    </div>
  );
}
