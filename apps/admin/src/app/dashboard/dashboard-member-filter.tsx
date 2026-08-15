"use client";

import { useI18n } from "@hacado/i18n/client";
import { MemberSelector } from "@hacado/ui-admin";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";

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
    <div className="flex justify-end">
      <MemberSelector
        className="w-full sm:w-72"
        value={member ?? undefined}
        allowClear
        placeholder={t("calendar.allMembers")}
        onItemSelect={(id) => {
          void setMember(id ?? null);
        }}
      />
    </div>
  );
};
