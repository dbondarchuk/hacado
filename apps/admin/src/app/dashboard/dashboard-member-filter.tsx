"use client";

import { useI18n } from "@hacado/i18n/client";
import { MemberSelectorCompact } from "@hacado/ui-admin";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";

/** URL-bound (`?member=`) compact member filter for the dashboard. */
export const DashboardMemberFilter: React.FC = () => {
  const t = useI18n("admin");
  const [member, setMember] = useQueryState(
    "member",
    parseAsString.withOptions({
      shallow: false,
      history: "replace",
    }),
  );

  return (
    <MemberSelectorCompact
      value={member ?? undefined}
      placeholder={t("calendar.allMembers")}
      onItemSelect={(id) => {
        void setMember(id ?? null);
      }}
    />
  );
};
