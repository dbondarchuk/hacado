"use client";

import { AuthFormProgress } from "@/components/admin/auth/auth-form-progress";
import { CompleteProfilePhoneStep } from "@/components/admin/auth/complete-profile-phone-step";
import {
  CompleteProfileProfileStep,
  type CompleteProfileProfileValues,
} from "@/components/admin/auth/complete-profile-profile-step";
import { PhoneOtpStep } from "@/components/admin/auth/phone-otp-step";
import { saveSignupMemberProfile } from "@/components/admin/auth/save-signup-member-profile";
import { AdminKeys, useI18n } from "@hacado/i18n/client";
import { toast } from "@hacado/ui";
import { useMemo, useState, type ReactNode } from "react";

type CompleteProfileStep = "profile" | "phone" | "phone-otp";

const COMPLETE_PROFILE_STEP_IDS: CompleteProfileStep[] = [
  "profile",
  "phone",
  "phone-otp",
];

const COMPLETE_PROFILE_STEP_LABELS: Record<CompleteProfileStep, AdminKeys> = {
  profile: "auth.completeProfile.progress.steps.profile",
  phone: "auth.completeProfile.progress.steps.phone",
  "phone-otp": "auth.completeProfile.progress.steps.phoneOtp",
};

export function CompleteProfileForm({
  defaultName,
  nextPath,
}: {
  defaultName: string;
  nextPath: string;
}) {
  const t = useI18n("admin");
  const [step, setStep] = useState<CompleteProfileStep>("profile");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CompleteProfileProfileValues | null>(
    null,
  );
  const [phone, setPhone] = useState("");

  const progressSteps = useMemo(
    () =>
      COMPLETE_PROFILE_STEP_IDS.map((id) => ({
        id,
        label: t(COMPLETE_PROFILE_STEP_LABELS[id]),
      })),
    [t],
  );

  const finish = async () => {
    if (!profile || !phone) return;

    setLoading(true);
    try {
      const result = await saveSignupMemberProfile({
        name: profile.name,
        phone,
        language: profile.language,
      });

      if (!result.ok) {
        toast.error(
          result.code === "phone_in_use"
            ? t("auth.phoneOtp.errors.phoneInUse")
            : t("auth.completeProfile.toasts.error"),
        );
        return;
      }

      toast.success(t("auth.completeProfile.toasts.success"));
      window.location.assign(nextPath);
    } finally {
      setLoading(false);
    }
  };

  const withProgress = (content: ReactNode) => (
    <div className="flex w-full flex-col gap-4">
      <AuthFormProgress steps={progressSteps} currentStepId={step} />
      {content}
    </div>
  );

  if (step === "phone-otp") {
    return withProgress(
      <PhoneOtpStep
        phone={phone}
        kind="complete-profile"
        onVerified={async () => {
          await finish();
        }}
      />,
    );
  }

  if (step === "phone") {
    return withProgress(
      <CompleteProfilePhoneStep
        disabled={loading}
        onBack={() => setStep("profile")}
        onContinue={(data) => {
          setPhone(data.phone);
          setStep("phone-otp");
        }}
      />,
    );
  }

  return withProgress(
    <CompleteProfileProfileStep
      defaultName={defaultName}
      disabled={loading}
      onContinue={(data) => {
        setProfile(data);
        setStep("phone");
      }}
    />,
  );
}
