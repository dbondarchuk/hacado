"use client";

import { useI18n } from "@hacado/i18n/client";
import { fieldTypes } from "@hacado/types";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@hacado/ui";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useAuth,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { Settings2 } from "lucide-react";
import { DeleteSelectedFieldsButton } from "./delete-selected";
import { useFieldsTableFilters } from "./use-table-filters";

export function FieldsTableAction() {
  const {
    typeFilter,
    setTypeFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useFieldsTableFilters();
  const { rowSelection } = useSelectedRowsStore();
  const { user } = useAuth();
  const canDelete = hasPermission(user, "service", "delete");
  const t = useI18n("admin");

  const additionalFilters = (
    <>
      <DataTableFilterBox
        filterKey="type"
        title={t("services.fields.table.columns.type")}
        options={fieldTypes.map((type) => ({
          value: type,
          label: t(`common.labels.fieldType.${type}`),
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
            tooltip={t("common.labels.filters")}
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
      {canDelete ? (
        <div className="flex flex-wrap items-center gap-4">
          <DeleteSelectedFieldsButton selected={rowSelection} />
        </div>
      ) : null}
    </div>
  );
}
