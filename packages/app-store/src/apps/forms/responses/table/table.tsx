"use client";

import { useI18n } from "@timelish/i18n/client";
import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton } from "@timelish/ui-admin";
import { useQueryStates } from "nuqs";
import React, { useEffect, useState } from "react";
import { getFormResponses } from "../../actions";
import { FormResponseModel } from "../../models";
import { columns } from "./columns";
import { searchParams } from "./search-params";

export const ResponsesTable: React.FC<{
  appId: string;
  /** When set, responses are filtered to this customer only (e.g. on customer tab). */
  customerIdLock?: string;
}> = ({ appId, customerIdLock }) => {
  const [query] = useQueryStates(searchParams);
  const delayedQuery = useDebounce(query, 100);
  const t = useI18n("admin");

  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<WithTotal<FormResponseModel>>({
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
        const customerIdFilter = customerIdLock
          ? [customerIdLock]
          : delayedQuery.customerId?.length
            ? delayedQuery.customerId
            : undefined;
        const res = await getFormResponses(appId, {
          offset,
          limit,
          search: delayedQuery.search || undefined,
          sort: delayedQuery.sort,
          formId: delayedQuery.formId?.length ? delayedQuery.formId : undefined,
          customerId: customerIdFilter,
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
      } catch (e: any) {
        console.error(e);
        toast.error(t("common.toasts.error"));
      } finally {
        setLoading(false);
      }
    };
    fn();
  }, [appId, customerIdLock, delayedQuery]);

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
