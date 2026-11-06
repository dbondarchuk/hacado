import { useI18n } from "@hacado/i18n/client";
import { useQueryStates } from "nuqs";
import React from "react";
import { searchParams } from "./search-params";

import { WithTotal } from "@hacado/types/database";
import { DataTable, DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { useDebounce } from "@hacado/ui/hooks";
import { toast } from "@hacado/ui/sonner";
import { getAppointmentReminders } from "../actions";
import { AppointmentReminder } from "../models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "../translations/types";
import { columns } from "./columns";

export const AppointmentRemindersTable: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const [query] = useQueryStates(searchParams);
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const delayedQuery = useDebounce(query, 100);

  const [loading, setLoading] = React.useState(true);
  const [response, setResponse] = React.useState<
    WithTotal<AppointmentReminder>
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

      const res = await getAppointmentReminders(appId, {
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
      toast.error(t("statusText.error_loading_appointment_reminders"));
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
