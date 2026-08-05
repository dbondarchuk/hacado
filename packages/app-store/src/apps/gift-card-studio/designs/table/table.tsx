"use client";

import { useI18n } from "@hacado/i18n/client";
import { WithTotal } from "@hacado/types";
import { toast, useDebounce } from "@hacado/ui";
import { DataTable, DataTableSkeleton } from "@hacado/ui-admin";
import { useQueryStates } from "nuqs";
import React from "react";
import { getDesigns } from "../../actions";
import { DesignListModel } from "../../models";
import { columns } from "./columns";
import { searchParams } from "./search-params";

export const DesignsTable: React.FC<{ appId: string }> = ({ appId }) => {
  const [query] = useQueryStates(searchParams);
  const t = useI18n("admin");
  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<WithTotal<DesignListModel>>({
    items: [],
    total: 0,
  });

  const fn = async (q: typeof delayedQuery) => {
    setLoading(true);
    try {
      const page = q.page;
      const limit = q.limit;
      const offset = (page - 1) * limit;
      const res = await getDesigns(appId, {
        offset,
        limit,
        search: q.search || undefined,
        sort: q.sort,
        isArchived: q.isArchived,
      });
      setResponse({
        items: (res.items ?? []).map((item) => ({ ...item, appId })),
        total: res.total ?? 0,
      });
    } catch (e: unknown) {
      console.error(e);
      toast.error(t("common.toasts.error"));
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
