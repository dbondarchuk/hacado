"use client";
import { authClient } from "@/app/auth-client";
import { AuthFormProgress } from "@/components/admin/auth/auth-form-progress";
import { EmailOtpStep } from "@/components/admin/auth/email-otp-step";
import { PhoneOtpStep } from "@/components/admin/auth/phone-otp-step";
import { saveSignupMemberProfile } from "@/components/admin/auth/save-signup-member-profile";
import { SocialAuthButtons } from "@/components/admin/auth/social-auth-buttons";
import {
  captchaFetchOptions,
  isCaptchaError,
  TurnstileField,
  useTurnstileField,
} from "@/components/admin/auth/turnstile-field";
import { buildCompleteProfileCallbackUrl } from "@/lib/auth/complete-profile-callback";
import type { SocialAuthProvider } from "@/lib/auth/social-auth-providers";
import { BaseAllKeys, languages, useI18n } from "@hacado/i18n/client";
import { zEmail, zPhone } from "@hacado/types";
import {
  Button,
  Combobox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Link,
  PhoneInput,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type SignupStep =
  | "profile"
  | "credentials"
  | "email-otp"
  | "phone"
  | "phone-otp";

const SIGNUP_STEP_IDS: SignupStep[] = [
  "profile",
  "credentials",
  "email-otp",
  "phone",
  "phone-otp",
];

export const UserSignupForm = ({
  invitation,
  turnstileSiteKey,
  enabledSocialProviders = [],
}: {
  publicDomain: string;
  invitation?: {
    id: string;
    email: string;
    organizationName: string;
  } | null;
  turnstileSiteKey: string;
  enabledSocialProviders?: SocialAuthProvider[];
}) => {
  const profileSchema = useMemo(
    () =>
      z.object({
        language: z.enum(languages, {
          error: "admin.auth.validation.language.invalid" satisfies BaseAllKeys,
        }),
        name: z
          .string({
            error: "admin.auth.validation.name.required" satisfies BaseAllKeys,
          })
          .min(1, {
            error: "admin.auth.validation.name.required" satisfies BaseAllKeys,
          })
          .max(256, {
            error: "admin.auth.validation.name.max" satisfies BaseAllKeys,
          }),
      }),
    [],
  );

  const credentialsSchema = useMemo(
    () =>
      z
        .object({
          email: zEmail,
          password: z
            .string({
              error:
                "admin.auth.validation.password.required" satisfies BaseAllKeys,
            })
            .min(8, {
              error:
                "admin.auth.validation.password.minLength" satisfies BaseAllKeys,
            })
            .max(128, {
              error:
                "admin.auth.validation.password.maxLength" satisfies BaseAllKeys,
            }),
          confirmPassword: z.string({
            error: "admin.auth.validation.confirmPassword.required",
          }),
        })
        .superRefine((data, ctx) => {
          if (data.password !== data.confirmPassword) {
            ctx.addIssue({
              code: "custom",
              path: ["confirmPassword"],
              message: "admin.auth.validation.confirmPassword.required",
            });
          }
        }),
    [],
  );

  const phoneSchema = useMemo(() => z.object({ phone: zPhone }), []);

  type ProfileValues = z.infer<typeof profileSchema>;
  type CredentialsValues = z.infer<typeof credentialsSchema>;
  type PhoneValues = z.infer<typeof phoneSchema>;

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [step, setStep] = useState<SignupStep>("profile");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileValues | null>(null);
  const [credentials, setCredentials] = useState<CredentialsValues | null>(
    null,
  );
  const [phone, setPhone] = useState("");
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const t = useI18n("admin");
  const turnstile = useTurnstileField();

  const progressSteps = useMemo(
    () =>
      SIGNUP_STEP_IDS.map((id) => ({
        id,
        label: t(
          id === "profile"
            ? "auth.signUp.progress.steps.profile"
            : id === "credentials"
              ? "auth.signUp.progress.steps.credentials"
              : id === "email-otp"
                ? "auth.signUp.progress.steps.emailOtp"
                : id === "phone"
                  ? "auth.signUp.progress.steps.phone"
                  : "auth.signUp.progress.steps.phoneOtp",
        ),
      })),
    [t],
  );

  const withProgress = (content: ReactNode) => (
    <div className="flex w-full flex-col gap-4">
      <AuthFormProgress steps={progressSteps} currentStepId={step} />
      {content}
    </div>
  );

  const postAuthPath = invitation
    ? `/accept-invitation?invitationId=${encodeURIComponent(invitation.id)}`
    : (callbackUrl ?? "/checkout");
  const googleCallbackURL = buildCompleteProfileCallbackUrl(postAuthPath);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", language: "en" },
    mode: "onChange",
  });

  const credentialsForm = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: invitation?.email ?? "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
    mode: "onChange",
  });

  const onProfileContinue = async (data: ProfileValues) => {
    setProfile(data);
    setStep("credentials");
  };

  const onCredentialsContinue = async (data: CredentialsValues) => {
    if (!profile) return;

    const captchaToken = turnstile.token;
    if (turnstileSiteKey && !captchaToken) {
      toast.error(t("auth.captcha.error"));
      return;
    }

    setLoading(true);
    try {
      const email = invitation?.email ?? data.email;
      const response = await authClient.signUp.email({
        email,
        password: data.password,
        name: profile.name,
        callbackURL: postAuthPath,
        ...(captchaToken
          ? { fetchOptions: captchaFetchOptions(captchaToken) }
          : {}),
      });

      if (response.error?.message) {
        if (response.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          toast.error(t("auth.signUp.toasts.userAlreadyExists"));
        } else if (isCaptchaError(response.error)) {
          toast.error(t("auth.captcha.error"));
          turnstile.reset();
        } else if (
          response.error.code === "SIGNUP_EMAIL_BLOCKED" ||
          response.error.message
            .toLowerCase()
            .includes("cannot accept this email")
        ) {
          toast.error(t("auth.signUp.toasts.emailBlocked"));
        } else if (
          response.error.code === "SIGNUP_REGION_BLOCKED" ||
          response.error.message.toLowerCase().includes("region")
        ) {
          toast.error(t("auth.signUp.regionBlocked.toast"));
        } else {
          toast.error(t("auth.signUp.toasts.error"));
        }
        return;
      }

      if (response.data?.user) {
        setCredentials({ ...data, email });
        setCreatedUserId(response.data.user.id);
        setStep("email-otp");
      }
    } finally {
      turnstile.reset();
      setLoading(false);
    }
  };

  const onPhoneContinue = async (data: PhoneValues) => {
    setPhone(data.phone);
    setStep("phone-otp");
  };

  const finishSignup = async () => {
    if (!profile || !credentials || !phone) return;

    setLoading(true);
    try {
      const saveResult = await saveSignupMemberProfile({
        userId: createdUserId ?? undefined,
        email: credentials.email,
        name: profile.name,
        phone,
        language: profile.language,
      });

      if (!saveResult.ok) {
        toast.error(
          saveResult.code === "phone_in_use"
            ? t("auth.phoneOtp.errors.phoneInUse")
            : t("auth.signUp.toasts.error"),
        );
        return;
      }

      toast.success(t("auth.signUp.toasts.accountReady"));
      // Full navigation so root i18n/session pick up post-signup state (install keys).
      window.location.assign(postAuthPath);
    } finally {
      setLoading(false);
    }
  };

  const signInLink = (
    <div className="w-full text-center text-base">
      {t.rich("auth.sign_up_sign_in_link", {
        link: (chunks: any) => (
          <Link
            href={
              invitation
                ? `/auth/signin?callbackUrl=${encodeURIComponent(
                    `/accept-invitation?invitationId=${invitation.id}`,
                  )}`
                : "/auth/signin"
            }
            className="ml-auto w-full"
            variant="underline"
          >
            {chunks}
          </Link>
        ),
      })}
    </div>
  );

  if (step === "email-otp" && credentials) {
    return withProgress(
      <EmailOtpStep
        email={credentials.email}
        onVerified={async () => setStep("phone")}
      />,
    );
  }

  if (step === "phone") {
    return withProgress(
      <Form {...phoneForm}>
        <form
          onSubmit={phoneForm.handleSubmit(onPhoneContinue)}
          className="w-full space-y-2"
        >
          <FormField
            control={phoneForm.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signUp.phone")}</FormLabel>
                <FormControl>
                  <PhoneInput
                    label={t("auth.signUp.phone")}
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {loading && <Spinner />}
            {t("auth.signUp.continue")}
          </Button>
        </form>
      </Form>,
    );
  }

  if (step === "phone-otp") {
    return withProgress(
      <PhoneOtpStep
        phone={phone}
        kind="signup"
        onVerified={async () => {
          await finishSignup();
        }}
      />,
    );
  }

  if (step === "credentials") {
    return withProgress(
      <>
        <Form {...credentialsForm}>
          <form
            onSubmit={credentialsForm.handleSubmit(onCredentialsContinue)}
            className="w-full space-y-2"
          >
            <FormField
              control={credentialsForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.signUp.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("auth.signUp.emailPlaceholder")}
                      disabled={loading || !!invitation}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={credentialsForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.signUp.password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("auth.signUp.passwordPlaceholder")}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={credentialsForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.signUp.confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TurnstileField
              siteKey={turnstileSiteKey}
              widgetRef={turnstile.widgetRef}
              onTokenChange={turnstile.setToken}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => setStep("profile")}
              >
                {t("auth.signUp.back")}
              </Button>
              <Button
                disabled={loading || (!!turnstileSiteKey && !turnstile.token)}
                className="w-full"
                type="submit"
              >
                {loading && <Spinner />}
                {t("auth.signUp.continue")}
              </Button>
            </div>
          </form>
        </Form>
        {signInLink}
      </>,
    );
  }

  return withProgress(
    <>
      {enabledSocialProviders.length > 0 ? (
        <SocialAuthButtons
          enabledProviders={enabledSocialProviders}
          callbackURL={googleCallbackURL}
          invitationId={invitation?.id}
        />
      ) : null}
      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(onProfileContinue)}
          className="w-full space-y-2"
        >
          <FormField
            control={profileForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signUp.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("auth.signUp.namePlaceholder")}
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={profileForm.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signUp.language")}</FormLabel>
                <FormControl>
                  <Combobox
                    className="w-full"
                    placeholder={t("auth.signUp.languagePlaceholder")}
                    values={languages.map((language) => ({
                      label: t(`common.labels.languages.${language}`),
                      value: language,
                    }))}
                    value={field.value}
                    onItemSelect={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="ml-auto w-full" type="submit">
            {t("auth.signUp.continue")}
          </Button>
        </form>
      </Form>
      {signInLink}
    </>,
  );
};
