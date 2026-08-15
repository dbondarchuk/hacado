"use client";

import { Card, CardContent, CardHeader } from "@hacado/ui";
import React from "react";
import { WaitlistAdminKeys } from "../translations/types";
import { WaitlistCard } from "./components/waitlist-card";

export const WaitlistTabClient: React.FC<{
  appId: string;
  waitlistEntries: {
    items: any[];
    total: number;
  };
  t: (key: WaitlistAdminKeys) => string;
}> = ({ appId, waitlistEntries, t }) => {
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
