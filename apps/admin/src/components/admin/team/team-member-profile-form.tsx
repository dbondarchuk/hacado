"use client";

import { ProfileForm } from "@/components/admin/users/profile-form";
import { adminApi, UserUpdate } from "@hacado/api-sdk";
import React from "react";

export const TeamMemberProfileForm: React.FC<{
  memberId: string;
  values: UserUpdate & { email: string };
}> = ({ memberId, values }) => {
  return (
    <ProfileForm
      values={values}
      canManageCalendarSources={false}
      canManageMeetingUrlProvider={false}
      showSecuritySection={false}
      onSave={async (data) => {
        await adminApi.teams.updateMemberProfile(memberId, data);
      }}
    />
  );
};
