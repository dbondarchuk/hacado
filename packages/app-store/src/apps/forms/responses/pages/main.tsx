"use client";

import { dispatchDashboardBadge } from "@hacado/ui-admin";
import React from "react";
import { markFormResponsesRead } from "../../actions";
import { FORMS_UNREAD_RESPONSES_BADGE_KEY } from "../../const";
import { ResponsesTable } from "../table/table";
import { ResponsesTableAction } from "../table/table-action";

export function FormsResponsesPage({ appId }: { appId: string }) {
  React.useEffect(() => {
    void markFormResponsesRead(appId).then(() => {
      dispatchDashboardBadge({
        key: FORMS_UNREAD_RESPONSES_BADGE_KEY,
        count: 0,
      });
    });
  }, [appId]);

  return (
    <div className="flex flex-col flex-1 gap-8">
      <ResponsesTableAction appId={appId} />
      <ResponsesTable appId={appId} />
    </div>
  );
}
