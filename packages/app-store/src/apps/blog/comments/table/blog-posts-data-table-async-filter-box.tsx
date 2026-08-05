"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "@hacado/ui-admin";
import React from "react";
import { getBlogPosts } from "../../actions";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";

export const BlogPostsDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey"> & {
    appId: string;
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ appId, title: propsTitle, filterKey = "postId", ...rest }) => {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const title = propsTitle ?? t("comments.table.filters.post");

  const fetchItems = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await getBlogPosts(appId, {
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
      });

      return {
        items: (result.items ?? []).map((post) => ({
          label: post.title,
          shortLabel: post.title,
          value: post._id,
        })) satisfies AsyncFilterBoxOption[],
        hasMore:
          (result.items?.length ?? 0) + (page - 1) * limit < result.total,
      };
    },
    [appId, rest.filterValue],
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={fetchItems}
      {...rest}
    />
  );
};
