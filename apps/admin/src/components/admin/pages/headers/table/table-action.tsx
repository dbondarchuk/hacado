"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { DeleteSelectedPageHeadersButton } from "./delete-selected";
import { usePageHeadersTableFilters } from "./use-table-filters";

export function PageHeadersTableAction() {
  const t = useI18n("admin");
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = usePageHeadersTableFilters();
  const { rowSelection } = useSelectedRowsStore();

  const additionalFilters = <></>;

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {/* <Popover>
          <PopoverTrigger
            tooltip={t("pages.table.filters.filters")}
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
        </Popover> */}
        <div className="hidden md:flex flex-row gap-4">{additionalFilters}</div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <DeleteSelectedPageHeadersButton selected={rowSelection} />
      </div>
    </div>
  );
}
