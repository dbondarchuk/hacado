"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  ButtonGroup,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import {
  DataTableFilterBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin";
import { HeaderActionButtonsPortal } from "@hacado/ui-admin-kit";
import { Plus, Receipt, Settings2 } from "lucide-react";
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

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <HeaderActionButtonsPortal>
        <Link
          href="/dashboard/gift-card-studio/purchases"
          button
          variant="outline"
          aria-label={t("app.pages.purchases.title")}
        >
          <Receipt size={16} />
          <span className="max-md:hidden">
            {t("app.pages.purchases.title")}
          </span>
        </Link>
        <Link
          href="/dashboard/gift-card-studio/new"
          button
          variant="default"
          aria-label={t("designs.table.actions.create")}
        >
          <Plus size={16} />
          <span className="max-md:hidden">
            {t("designs.table.actions.create")}
          </span>
        </Link>
      </HeaderActionButtonsPortal>
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
      <div className="flex flex-wrap max-md:flex-row-reverse items-center gap-4 max-md:justify-between">
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
          <DeleteSelectedDesignsButton
            appId={appId}
            selected={rowSelection}
            disabled={!canDeleteAll}
          />
        </ButtonGroup>
      </div>
    </div>
  );
};
