"use client";

import { useQueryStates } from "nuqs";
import React from "react";
import { searchParams } from "./search-params";

import { useI18n } from "@timelish/i18n/client";
import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton } from "@timelish/ui-admin";
import { getBlogPosts } from "../actions";
import { BlogPost } from "../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";
import { columns } from "./columns";

export const BlogTable: React.FC<{ appId: string }> = ({ appId }) => {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const [query] = useQueryStates(searchParams);

  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<
    WithTotal<BlogPost & { appId: string }>
  >({
    items: [],
    total: 0,
  });

  const fn = async (query: typeof delayedQuery) => {
    setLoading(true);

    try {
      const page = query.page;
      const search = query.search || undefined;
      const limit = query.limit;
      const sort = query.sort;

      const offset = (page - 1) * limit;

      const res = await getBlogPosts(appId, {
        offset,
        limit,
        search,
        sort,
        isPublished: undefined, // Show all posts in admin
      });

      setResponse({
        items: res.items?.map((item) => ({ ...item, appId })) || [],
        total: res.total,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(t("table.toast.error_loading_blog_posts"));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fn(delayedQuery);
  }, [delayedQuery]);

  return loading ? (
    <DataTableSkeleton rowCount={10} columnCount={columns.length} />
  ) : (
    <DataTable
      columns={columns}
      data={response.items}
      totalItems={response.total}
      sortSchemaDefault={searchParams.sort.defaultValue}
    />
  );
};
