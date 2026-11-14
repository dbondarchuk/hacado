"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  TableToolbarActionLabel,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { ButtonGroup } from "@hacado/ui/button-group";
import { Link } from "@hacado/ui/link";
import { Plus, RectangleEllipsis } from "lucide-react";
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

  const toolbarActions = (
    <>
      <Link
        href="/dashboard/forms/responses"
        button
        size="sm"
        variant="outline"
        aria-label={t("forms.table.actions.viewResponses")}
      >
        <RectangleEllipsis size={16} />
        <TableToolbarActionLabel>
          {t("forms.table.actions.viewResponses")}
        </TableToolbarActionLabel>
      </Link>
      <Link
        href="/dashboard/forms/new"
        button
        size="sm"
        variant="default"
        aria-label={t("forms.table.actions.create")}
      >
        <Plus size={16} />
        <TableToolbarActionLabel>
          {t("forms.table.actions.create")}
        </TableToolbarActionLabel>
      </Link>
    </>
  );

  return (
    <>
      <DataTableToolbar actions={toolbarActions}>
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
      <SelectionActionBar
        count={rowSelection.length}
        primary={
          <DeleteSelectedFormsButton
            selected={rowSelection}
            appId={appId}
            disabled={!canDeleteAll}
          />
        }
      >
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
        </ButtonGroup>
      </SelectionActionBar>
    </>
  );
};
