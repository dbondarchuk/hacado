"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DataTableResetFilter,
  DataTableSearch,
  DataTableToolbar,
  TableToolbarActionLabel,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { SelectionActionBar } from "@hacado/ui-admin/selection-action-bar";
import { Link } from "@hacado/ui/link";
import { Plus } from "lucide-react";
import React from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";
import { DeleteSelectedBlogPostsButton } from "./delete-selected";
import { useBlogTableFilters } from "./use-table-filters";

export const BlogTableAction: React.FC<{ appId: string }> = ({ appId }) => {
  const { rowSelection } = useSelectedRowsStore();
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useBlogTableFilters();

  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const toolbarActions = (
    <Link
      href="/dashboard/blog/new"
      button
      size="sm"
      variant="default"
      aria-label={t("table.actions.create")}
    >
      <Plus size={16} />
      <TableToolbarActionLabel>
        {t("table.actions.create")}
      </TableToolbarActionLabel>
    </Link>
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
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </DataTableToolbar>
      <SelectionActionBar count={rowSelection.length}>
        <DeleteSelectedBlogPostsButton selected={rowSelection} appId={appId} />
      </SelectionActionBar>
    </>
  );
};
