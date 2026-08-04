"use client";

import { ProfileForm as SharedProfileForm } from "@/components/admin/users/profile-form";
import { adminApi, UserUpdate } from "@timelish/api-sdk";
import React from "react";

export const ProfileForm: React.FC<{
  values: UserUpdate & { email: string };
  canManageCalendarSources?: boolean;
}> = ({ values, canManageCalendarSources = true }) => {
  return (
    <SharedProfileForm
      values={values}
      canManageCalendarSources={canManageCalendarSources}
      canManageMeetingUrlProvider
      showSecuritySection
      isSelfProfile
      onSave={async (data) => {
        await adminApi.users.updateMyUser(data);
      }}
    />
  );
};
