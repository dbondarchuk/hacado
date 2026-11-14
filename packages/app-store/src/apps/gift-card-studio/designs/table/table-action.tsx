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
import { Plus, Receipt } from "lucide-react";
import React from "react";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { ArchiveSelectedDesignsButton } from "./archive-selected";
import { DeleteSelectedDesignsButton } from "./delete-selected";
import { UnarchiveSelectedDesignsButton } from "./unarchive-selected";
import { useDesignsTableFilters } from "./use-table-filters";

export const DesignsTableAction: React.FC<{ appId: string }> = ({ appId }) => {
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
  } = useDesignsTableFilters();

  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const additionalFilters = (
    <DataTableFilterBox
      filterKey="isArchived"
      title={t("designs.table.filters.status")}
      options={STATUS_OPTIONS}
      setFilterValue={setIsArchivedFilter}
      filterValue={isArchivedFilter}
    />
  );

  const canDeleteAll = rowSelection.every((d) => (d.purchasesCount ?? 0) === 0);
  const allArchived =
    rowSelection.length > 0 && rowSelection.every((d) => d.isArchived);

  const allActive =
    rowSelection.length > 0 && rowSelection.every((d) => !d.isArchived);

  const toolbarActions = (
    <>
      <Link
        href="/dashboard/gift-card-studio/purchases"
        button
        size="sm"
        variant="outline"
        aria-label={t("app.pages.purchases.title")}
      >
        <Receipt size={16} />
        <TableToolbarActionLabel>
          {t("app.pages.purchases.title")}
        </TableToolbarActionLabel>
      </Link>
      <Link
        href="/dashboard/gift-card-studio/new"
        button
        size="sm"
        variant="default"
        aria-label={t("designs.table.actions.create")}
      >
        <Plus size={16} />
        <TableToolbarActionLabel>
          {t("designs.table.actions.create")}
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
          <DeleteSelectedDesignsButton
            appId={appId}
            selected={rowSelection}
            disabled={!canDeleteAll}
          />
        }
      >
        <ButtonGroup>
          <UnarchiveSelectedDesignsButton
            appId={appId}
            selected={rowSelection}
            disabled={!allArchived}
          />
          <ArchiveSelectedDesignsButton
            appId={appId}
            selected={rowSelection}
            disabled={!allActive}
          />
        </ButtonGroup>
      </SelectionActionBar>
    </>
  );
};
