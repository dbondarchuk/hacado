import { useI18n } from "@timelish/i18n/client";
import { useQueryStates } from "nuqs";
import React from "react";
import { searchParams } from "./search-params";

import { WithTotal } from "@timelish/types";
import { toast, useDebounce } from "@timelish/ui";
import { DataTable, DataTableSkeleton } from "@timelish/ui-admin";
import { getAppointmentNotifications } from "../actions";
import { AppointmentNotification } from "../models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "../translations/types";
import { columns } from "./columns";

export const AppointmentNotificationsTable: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const [query] = useQueryStates(searchParams);
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);

  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<
    WithTotal<AppointmentNotification>
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
      const channel = query.channel;
      const sort = query.sort;
      const type = query.type;

      const offset = (page - 1) * limit;

      const res = await getAppointmentNotifications(appId, {
        channel,
        offset,
        limit,
        search,
        sort,
        type,
      });

      setResponse(res);
    } catch (e: any) {
      console.error(e);
      toast.error(t("statusText.error_loading_appointment_notifications"));
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
