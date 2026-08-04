"use client";

import { useI18n } from "@timelish/i18n/client";
import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton, useReload } from "@timelish/ui-admin";
import { useQueryStates } from "nuqs";
import React from "react";
import { getPurchasedGiftCards } from "../../actions";
import { PurchasedGiftCardListModel } from "../../models";
import { columns } from "./columns";
import { searchParams } from "./search-params";

export const PurchasesTable: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const [query] = useQueryStates(searchParams);
  const t = useI18n("admin");
  const delayedQuery = useDebounce(query, 100);
  const { refreshKey } = useReload();

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<
    WithTotal<PurchasedGiftCardListModel>
  >({ items: [], total: 0 });

  const fetch = async (
    q: typeof delayedQuery,
    options?: {
      silent?: boolean;
    },
  ) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const page = q.page;
      const limit = q.limit;
      const offset = (page - 1) * limit;
      const res = await getPurchasedGiftCards(appId, {
        offset,
        limit,
        sort: q.sort,
        search: q.search?.trim() || undefined,
        designId: q.designId?.length ? q.designId : undefined,
        customerId: q.customerId?.length ? q.customerId : undefined,
      });

      setResponse({
        items: (res.items ?? []).map((item) => ({ ...item, appId })),
        total: res.total ?? 0,
      });
    } catch (e: unknown) {
      console.error(e);
      toast.error(t("common.toasts.error"));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  React.useEffect(() => {
    fetch(delayedQuery);
  }, [delayedQuery, refreshKey]);

  const hasPending = React.useMemo(
    () =>
      response.items?.some(
        (item) =>
          item.cardGenerationStatus === "pending" ||
          item.invoiceGenerationStatus === "pending",
      ),
    [response.items],
  );

  React.useEffect(() => {
    if (!hasPending) {
      return;
    }

    const intervalId = setInterval(() => {
      void fetch(delayedQuery, { silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [hasPending, delayedQuery]);

  return (
    <>
      {loading ? (
        <DataTableSkeleton rowCount={10} columnCount={columns.length} />
      ) : (
        <DataTable
          columns={columns}
          data={response.items}
          totalItems={response.total}
          sortSchemaDefault={searchParams.sort.defaultValue}
        />
      )}
    </>
  );
};
