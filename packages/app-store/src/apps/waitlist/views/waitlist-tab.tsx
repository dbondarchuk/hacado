import { getI18nAsync } from "@hacado/i18n/server";
import { IConnectedAppProps } from "@hacado/types";
import { Card, CardContent, CardHeader } from "@hacado/ui";
import { DateTime } from "luxon";
import React from "react";
import { WaitlistRepositoryService } from "../service/repository-service";
import {
  WaitlistAdminKeys,
  waitlistAdminNamespace,
  WaitlistAdminNamespace,
} from "../translations/types";
import { WaitlistCard } from "./components/waitlist-card";

export const WaitlistTab: React.FC<{
  appId: string;
  props: IConnectedAppProps;
}> = async ({ appId, props }) => {
  const t = await getI18nAsync<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const beforeNow = DateTime.now().toJSDate();
  const repositoryService = new WaitlistRepositoryService(
    appId,
    props.organizationId,
    props.getDbConnection,
    props.services,
  );

  const waitlistEntries = await repositoryService.getWaitlistEntries({
    limit: 24,
    sort: [{ id: "createdAt", desc: false }],
    range: {
      start: beforeNow,
    },
    status: ["active"],
  });

  return (
    <>
      {waitlistEntries.total === 0 ? (
        <Card>
          <CardHeader className="flex text-center font-medium text-lg">
            {t("tab.noWaitlistEntries")}
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            {t("tab.caughtUp")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap gap-2">
          {waitlistEntries.items.map((entry) => (
            <WaitlistCard key={entry._id} entry={entry} appId={appId} />
          ))}
        </div>
      )}
    </>
  );
};
