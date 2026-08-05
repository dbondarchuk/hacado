"use client";

import { useI18n } from "@hacado/i18n/client";
import { WithTotal } from "@hacado/types";
import { toast, useDebounce } from "@hacado/ui";
import { DataTable, DataTableSkeleton } from "@hacado/ui-admin";
import { useQueryStates } from "nuqs";
import React, { useEffect, useMemo, useState } from "react";
import { getBlogComments } from "../../actions";
import { BlogCommentListItem, BlogCommentStatus } from "../../models";
import { columns, CommentsTableRow } from "./columns";
import { searchParams } from "./search-params";

export const CommentsTable: React.FC<{ appId: string }> = ({ appId }) => {
  const [query] = useQueryStates(searchParams);
  const delayedQuery = useDebounce(query, 100);
  const t = useI18n("admin");

  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<WithTotal<BlogCommentListItem>>({
    items: [],
    total: 0,
  });

  useEffect(() => {
    const fn = async () => {
      setLoading(true);
      try {
        const page = delayedQuery.page;
        const limit = delayedQuery.limit;
        const offset = (page - 1) * limit;
        const res = await getBlogComments(appId, {
          offset,
          limit,
          search: delayedQuery.search || undefined,
          sort: delayedQuery.sort,
          postId: delayedQuery.postId?.length ? delayedQuery.postId : undefined,
          status: delayedQuery.status?.length
            ? (delayedQuery.status as BlogCommentStatus[])
            : undefined,
          range:
            delayedQuery.start || delayedQuery.end
              ? {
                  start: delayedQuery.start ?? undefined,
                  end: delayedQuery.end ?? undefined,
                }
              : undefined,
        });
        setResponse({
          items: res.items ?? [],
          total: res.total,
        });
      } catch (e: unknown) {
        console.error(e);
        toast.error(t("common.toasts.error"));
      } finally {
        setLoading(false);
      }
    };
    void fn();
  }, [appId, delayedQuery, t]);

  const data = useMemo(
    (): CommentsTableRow[] =>
      response.items.map((item) => ({ ...item, appId })),
    [response.items, appId],
  );

  return loading ? (
    <DataTableSkeleton rowCount={10} columnCount={columns.length} />
  ) : (
    <DataTable
      columns={columns}
      data={data}
      totalItems={response.total}
      sortSchemaDefault={searchParams.sort.defaultValue}
    />
  );
};
