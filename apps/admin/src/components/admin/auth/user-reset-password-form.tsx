"use client";

import { UserForgotPasswordForm } from "@/components/admin/auth/user-forgot-password-form";
import { useSearchParams } from "next/navigation";

/**
 * Deep-link entry (`/auth/reset-password?email=…`) after an OTP was already
 * requested - continues the same multi-step flow at the OTP step.
 */
export const UserResetPasswordForm = ({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) => {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";

  return (
    <UserForgotPasswordForm
      turnstileSiteKey={turnstileSiteKey}
      initialEmail={emailFromQuery}
      initialStep={emailFromQuery ? "otp" : "email"}
    />
  );
};
