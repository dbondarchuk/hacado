"use client";

import { useI18n } from "@hacado/i18n/client";
import { communicationChannels } from "@hacado/types";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@hacado/ui";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { Settings2 } from "lucide-react";
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

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("templates.table.filters.type")}
        options={communicationChannels.map((channel) => ({
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
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <Popover>
          <PopoverTrigger
            tooltip={t("templates.table.filters.filters")}
            asChild
            className="md:hidden"
          >
            <Button variant="outline">
              <Settings2 size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-2">
            {additionalFilters}
          </PopoverContent>
        </Popover>
        <div className="hidden md:flex flex-row gap-4">{additionalFilters}</div>
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
