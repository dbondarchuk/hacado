"use client";

import { useI18n } from "@hacado/i18n/client";
import { ResponsiveFilterBar } from "@hacado/ui-admin-kit/data-table";
import {
  DataTableFilterBox,
  DataTableRangeBox,
  DataTableResetFilter,
  DataTableSearch,
  useSelectedRowsStore,
} from "@hacado/ui-admin/data-table";
import { ButtonGroup } from "@hacado/ui/button-group";

import React from "react";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";
import { ApproveSelectedBlogCommentsButton } from "./approve-selected";
import { BlogPostsDataTableAsyncFilterBox } from "./blog-posts-data-table-async-filter-box";
import { DeleteSelectedBlogCommentsButton } from "./delete-selected";
import { RejectSelectedBlogCommentsButton } from "./reject-selected";
import { useCommentsTableFilters } from "./use-table-filters";

const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;

export const CommentsTableAction: React.FC<{ appId: string }> = ({ appId }) => {
  const { rowSelection } = useSelectedRowsStore();
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setSearchQuery,
    setPage,
    postIdFilter,
    setPostIdFilter,
    statusFilter,
    setStatusFilter,
    start,
    setStartValue,
    end,
    setEndValue,
  } = useCommentsTableFilters();

  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tAdmin = useI18n("admin");

  const canApprove = rowSelection.some((row) => row.status !== "approved");
  const canReject = rowSelection.some((row) => row.status !== "rejected");

  const statusOptions = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: t(`comments.status.${status}` satisfies BlogAdminKeys),
  }));

  const additionalFilters = (
    <>
      <BlogPostsDataTableAsyncFilterBox
        appId={appId}
        filterKey="postId"
        filterValue={postIdFilter}
        setFilterValue={setPostIdFilter}
      />
      <DataTableFilterBox
        filterKey="status"
        title={t("comments.table.filters.status")}
        options={statusOptions}
        setFilterValue={setStatusFilter as any}
        filterValue={statusFilter as any}
      />
      <DataTableRangeBox
        startValue={start}
        endValue={end}
        setStartValue={setStartValue}
        setEndValue={setEndValue}
      />
    </>
  );

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 w-full flex-1 flex-nowrap items-center gap-2 md:gap-4">
        <DataTableSearch
          searchKey="search"
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
      {rowSelection.length > 0 && (
        <ButtonGroup>
          <ApproveSelectedBlogCommentsButton
            appId={appId}
            selected={rowSelection}
            disabled={!canApprove}
          />
          <RejectSelectedBlogCommentsButton
            appId={appId}
            selected={rowSelection}
            disabled={!canReject}
          />
          <DeleteSelectedBlogCommentsButton
            appId={appId}
            selected={rowSelection}
          />
        </ButtonGroup>
      )}
    </div>
  );
};
