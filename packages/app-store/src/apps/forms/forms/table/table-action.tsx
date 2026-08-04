"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  ButtonGroup,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@timelish/ui";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@timelish/ui-admin";
import { HeaderActionButtonsPortal } from "@timelish/ui-admin-kit";
import { Plus, RectangleEllipsis, Settings2 } from "lucide-react";
import React from "react";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { ArchiveSelectedFormsButton } from "./archive-selected";
import { DeleteSelectedFormsButton } from "./delete-selected";
import { UnarchiveSelectedFormsButton } from "./unarchive-selected";
import { useFormsTableFilters } from "./use-table-filters";

export const FormsTableAction: React.FC<{ appId: string }> = ({ appId }) => {
  const { rowSelection } = useSelectedRowsStore();
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    isArchivedFilter,
    setIsArchivedFilter,
    STATUS_OPTIONS,
  } = useFormsTableFilters();
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const canDeleteAll = rowSelection.every((f) => (f.responsesCount ?? 0) === 0);
  const allArchived =
    rowSelection.length > 0 && rowSelection.every((f) => f.isArchived);
  const allPublic =
    rowSelection.length > 0 && rowSelection.every((f) => !f.isArchived);

  const additionalFilters = (
    <DataTableFilterBox
      filterKey="isArchived"
      title={t("forms.table.filters.status")}
      options={STATUS_OPTIONS}
      setFilterValue={setIsArchivedFilter}
      filterValue={isArchivedFilter}
    />
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
          <PopoverTrigger asChild>
            <Button variant="outline" className="md:hidden">
              <Settings2 size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-2">
            {additionalFilters}
          </PopoverContent>
        </Popover>
        <div className="hidden md:block">{additionalFilters}</div>
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <div className="flex flex-wrap max-md:flex-row-reverse items-center gap-2 max-md:justify-between">
        <ButtonGroup>
          <UnarchiveSelectedFormsButton
            selected={rowSelection}
            appId={appId}
            disabled={!allArchived}
          />
          <ArchiveSelectedFormsButton
            selected={rowSelection}
            appId={appId}
            disabled={!allPublic}
          />
          <DeleteSelectedFormsButton
            selected={rowSelection}
            appId={appId}
            disabled={!canDeleteAll}
          />
        </ButtonGroup>
        <HeaderActionButtonsPortal>
          <Link
            href="/dashboard/forms/responses"
            button
            variant="outline"
            aria-label={t("forms.table.actions.viewResponses")}
          >
            <RectangleEllipsis size={16} />
            <span className="max-md:hidden">
              {t("forms.table.actions.viewResponses")}
            </span>
          </Link>
          <Link
            href="/dashboard/forms/new"
            button
            variant="default"
            aria-label={t("forms.table.actions.create")}
          >
            <Plus size={16} />
            <span className="max-md:hidden">
              {t("forms.table.actions.create")}
            </span>
          </Link>
        </HeaderActionButtonsPortal>
      </div>
    </div>
  );
};
