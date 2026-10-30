"use client";

import { ProfileForm as SharedProfileForm } from "@/components/admin/users/profile-form";
import type { SocialAuthProvider } from "@/lib/auth/social-auth-providers";
import { UserUpdate } from "@hacado/api-sdk/admin/schemas/user";
import { usersApi } from "@hacado/api-sdk/admin/users";
import React from "react";

export const ProfileForm: React.FC<{
  values: UserUpdate & { email: string };
  canManageCalendarSources?: boolean;
  enabledSocialProviders?: SocialAuthProvider[];
}> = ({
  values,
  canManageCalendarSources = true,
  enabledSocialProviders = [],
}) => {
  return (
    <SharedProfileForm
      values={values}
      canManageCalendarSources={canManageCalendarSources}
      canManageMeetingUrlProvider
      showSecuritySection
      isSelfProfile
      enabledSocialProviders={enabledSocialProviders}
      onSave={async (data) => {
        await usersApi.updateMyUser(data);
      }}
    />
  );
};
