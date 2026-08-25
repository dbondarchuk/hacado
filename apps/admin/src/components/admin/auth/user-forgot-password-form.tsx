"use client";
import { authClient } from "@/app/auth-client";
import { AuthFormProgress } from "@/components/admin/auth/auth-form-progress";
import {
  EmailOtpStep,
  markEmailOtpSent,
} from "@/components/admin/auth/email-otp-step";
import {
  captchaFetchOptions,
  isCaptchaError,
  TurnstileField,
  useTurnstileField,
} from "@/components/admin/auth/turnstile-field";
import { useI18n } from "@hacado/i18n/client";
import { zEmail } from "@hacado/types";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Link,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type ResetStep = "email" | "otp" | "password";

const RESET_STEP_IDS: ResetStep[] = ["email", "otp", "password"];

const emailSchema = z.object({
  email: zEmail,
});

const passwordSchema = z
  .object({
    password: z
      .string({ error: "admin.auth.validation.password.required" })
      .min(8, { error: "admin.auth.validation.password.minLength" })
      .max(128, { error: "admin.auth.validation.password.maxLength" }),
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
  });

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export const UserForgotPasswordForm = ({
  turnstileSiteKey,
  initialEmail = "",
  initialStep = "email",
}: {
  turnstileSiteKey: string;
  initialEmail?: string;
  initialStep?: ResetStep;
}) => {
  const [step, setStep] = useState<ResetStep>(() => {
    if (initialEmail && initialStep === "otp") {
      markEmailOtpSent(initialEmail, "forget-password");
      return "otp";
    }
    return "email";
  });
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");
  const turnstile = useTurnstileField();
  const router = useRouter();

  const progressSteps = useMemo(
    () =>
      RESET_STEP_IDS.map((id) => ({
        id,
        label: t(
          id === "email"
            ? "auth.forgotPassword.progress.steps.email"
            : id === "otp"
              ? "auth.forgotPassword.progress.steps.otp"
              : "auth.forgotPassword.progress.steps.password",
        ),
      })),
    [t],
  );

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail },
    mode: "all",
    reValidateMode: "onChange",
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const withProgress = (content: ReactNode) => (
    <div className="flex w-full flex-col gap-4">
      <AuthFormProgress steps={progressSteps} currentStepId={step} />
      {content}
    </div>
  );

  const rememberPassword = (
    <div className="text-center w-full text-base">
      {t.rich("auth.forgotPassword.rememberPassword", {
        link: (chunks: any) => (
          <Link
            href="/auth/signin"
            className="ml-auto w-full"
            variant="underline"
          >
            {chunks}
          </Link>
        ),
      })}
    </div>
  );

  const onEmailContinue = async (data: EmailValues) => {
    const captchaToken = turnstile.token;
    if (!captchaToken) {
      toast.error(t("auth.captcha.error"));
      return;
    }

    setLoading(true);
    try {
      const response = await authClient.emailOtp.requestPasswordReset({
        email: data.email,
        fetchOptions: captchaFetchOptions(captchaToken),
      });

      if (response.error?.message) {
        console.error(response.error);
        toast.error(
          isCaptchaError(response.error)
            ? t("auth.captcha.error")
            : t("auth.forgotPassword.error"),
        );
        return;
      }

      toast.success(t("auth.forgotPassword.success"));
      markEmailOtpSent(data.email, "forget-password");
      setEmail(data.email);
      setStep("otp");
    } finally {
      turnstile.reset();
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordValues) => {
    if (!email || !otp) return;

    setLoading(true);
    try {
      const response = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: data.password,
      });

      if (response.error?.message) {
        console.error(response.error);
        toast.error(t("auth.resetPassword.invalidCode"));
        setStep("otp");
        setOtp("");
        return;
      }

      toast.success(t("auth.resetPassword.success"));
      router.push("/auth/signin");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp" && email) {
    return withProgress(
      <>
        <EmailOtpStep
          email={email}
          purpose="forget-password"
          autoSend={false}
          turnstileSiteKey={turnstileSiteKey}
          onVerified={async (verifiedOtp) => {
            setOtp(verifiedOtp);
            setStep("password");
          }}
        />
        {rememberPassword}
      </>,
    );
  }

  if (step === "password" && email && otp) {
    return withProgress(
      <>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="w-full space-y-2"
          >
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.resetPassword.password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("auth.resetPassword.passwordPlaceholder")}
                      disabled={loading}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("auth.resetPassword.confirmPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t(
                        "auth.resetPassword.confirmPasswordPlaceholder",
                      )}
                      disabled={loading}
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={loading}
              className="ml-auto w-full"
              type="submit"
              variant="brand-dark"
            >
              {loading && <Spinner />}
              {t("auth.resetPassword.submit")}
            </Button>
          </form>
        </Form>
        {rememberPassword}
      </>,
    );
  }

  return withProgress(
    <>
      <Form {...emailForm}>
        <form
          onSubmit={emailForm.handleSubmit(onEmailContinue)}
          className="w-full space-y-2"
        >
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.forgotPassword.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.forgotPassword.email")}
                    disabled={loading}
                    autoComplete="email"
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

          <Button
            disabled={loading || !turnstile.token}
            className="ml-auto w-full"
            type="submit"
            variant="brand-dark"
          >
            {loading && <Spinner />}
            {t("auth.forgotPassword.submit")}
          </Button>
        </form>
      </Form>
      {rememberPassword}
    </>,
  );
};
