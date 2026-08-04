"use client";

import { useI18n } from "@timelish/i18n/client";
import { Link } from "@timelish/ui";
import {
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@timelish/ui-admin";
import { HeaderActionButtonsPortal } from "@timelish/ui-admin-kit";
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

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 md:flex-wrap items-center gap-4">
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
      </div>
      <div className="flex flex-wrap items-center gap-2 max-md:justify-between">
        <DeleteSelectedBlogPostsButton selected={rowSelection} appId={appId} />
        <HeaderActionButtonsPortal>
          <Link
            href="/dashboard/blog/new"
            button
            variant="default"
            aria-label={t("table.actions.create")}
          >
            <Plus size={16} />
            <span className="max-md:hidden">{t("table.actions.create")}</span>
          </Link>
        </HeaderActionButtonsPortal>
      </div>
    </div>
  );
};
