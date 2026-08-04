"use client";

import { useQueryStates } from "nuqs";
import React from "react";
import { searchParams } from "./search-params";

import { useI18n } from "@timelish/i18n/client";
import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton } from "@timelish/ui-admin";
import { getForms } from "../../actions";
import { FormListModel } from "../../models";
import { columns } from "./columns";

export const FormsTable: React.FC<{ appId: string }> = ({ appId }) => {
  const [query] = useQueryStates(searchParams);

  const t = useI18n("admin");
  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<WithTotal<FormListModel>>({
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

      const res = await getForms(appId, {
        offset,
        limit,
        search,
        sort,
        isArchived: query.isArchived,
      });

      setResponse({
        items: res.items?.map((item) => ({ ...item, appId })) || [],
        total: res.total,
      });
    } catch (e: any) {
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
