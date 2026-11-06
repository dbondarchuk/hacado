"use client";

import { AppointmentRemindersTable } from "./table/table";
import { AppointmentRemindersTableAction } from "./table/table-action";

export const AppointmentRemindersPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  return (
    <div className="flex flex-col flex-1 gap-8">
      <AppointmentRemindersTableAction appId={appId} />
      <AppointmentRemindersTable appId={appId} />
    </div>
  );
};
