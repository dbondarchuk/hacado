"use client";

import { useQueryStates } from "nuqs";
import React from "react";
import { searchParams } from "./search-params";

import { useI18n } from "@timelish/i18n/client";
import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton } from "@timelish/ui-admin";
import { getWaitlistEntries } from "../actions";
import { WaitlistEntry } from "../models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";
import { columns } from "./columns";

export const WaitlistTable: React.FC<{
  appId: string;
  /** When set, entries are filtered to this customer only (e.g. on customer tab). */
  customerIdLock?: string;
}> = ({ appId, customerIdLock }) => {
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const [query] = useQueryStates(searchParams);

  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<
    WithTotal<WaitlistEntry & { appId: string }>
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
      const optionId = query.option;
      const customerId = customerIdLock ? [customerIdLock] : query.customer;
      const memberId = query.member;
      const status = query.status;
      const start = query.start;
      const end = query.end;
      const sort = query.sort;

      const offset = (page - 1) * limit;

      const range =
        start && end
          ? { start: start || undefined, end: end || undefined }
          : undefined;

      const res = await getWaitlistEntries(appId, {
        optionId: optionId || undefined,
        customerId: customerId?.length ? customerId : undefined,
        memberId: memberId?.length ? memberId : undefined,
        status,
        range,
        offset,
        limit,
        search,
        sort,
      });

      setResponse({
        items: res.items?.map((item) => ({ ...item, appId })) || [],
        total: res.total,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(t("table.toast.error_loading_waitlist_entries"));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fn(delayedQuery);
  }, [delayedQuery, customerIdLock]);

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
