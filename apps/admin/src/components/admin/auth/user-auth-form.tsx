"use client";
import { authClient } from "@/app/auth-client";
import {
  LastUsedInlineBadge,
  SocialAuthButtons,
} from "@/components/admin/auth/social-auth-buttons";
import { buildCompleteProfileCallbackUrl } from "@/lib/auth/complete-profile-callback";
import type { SocialAuthProvider } from "@/lib/auth/social-auth-providers";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Link,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.email({ error: "common.email.invalid" }),
  password: z.string(),
});

type UserFormValue = z.infer<typeof formSchema>;

export const UserAuthForm = ({
  enabledSocialProviders = [],
}: {
  enabledSocialProviders?: SocialAuthProvider[];
}) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const paramError = searchParams.get("error");
  const paramVerified = searchParams.get("verified");

  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");
  const defaultValues = {
    email: "",
    password: "",
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const router = useRouter();
  const isEmailLastUsed = authClient.getLastUsedLoginMethod() === "email";

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl ?? "/dashboard",
      });

      if (response.error?.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setError(null);
        setOtp("");
        // Auto-send verification OTP
        void sendVerificationOtp(data.email);
        return;
      }

      if (response.error?.message) {
        setError(response.error?.message ?? null);
      }

      if (response.data?.user) {
        router.push(callbackUrl ?? "/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationOtp = async (email: string) => {
    setSendingOtp(true);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (response.error?.message) {
        throw new Error(response.error.message);
      }
      toast.success(t("auth.verification.success"));
    } catch (err) {
      console.error(err);
      toast.error(t("auth.verification.error"));
    } finally {
      setSendingOtp(false);
    }
  };

  const onVerifyEmail = async () => {
    const email = form.getValues("email");
    if (otp.length !== 6) {
      toast.error(t("auth.verification.invalidCode"));
      return;
    }
    setVerificationLoading(true);
    try {
      const response = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });
      if (response.error?.message) {
        toast.error(t("auth.verification.invalidCode"));
        return;
      }
      toast.success(t("auth.verification.verified"));
      setNeedsVerification(false);
      // Retry sign-in with stored password
      const password = form.getValues("password");
      const signIn = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl ?? "/dashboard",
      });
      if (signIn.data?.user) {
        router.push(callbackUrl ?? "/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error(t("auth.verification.error"));
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    if (paramError === "invalid_token") {
      toast.error(t("auth.verification.invalidToken"));
    }
  }, [paramError, t]);

  useEffect(() => {
    if (paramVerified === "true") {
      toast.success(t("auth.verification.verified"));
    }
  }, [paramVerified, t]);

  return (
    <div className="w-full flex flex-col gap-4">
      {enabledSocialProviders.length > 0 ? (
        <SocialAuthButtons
          enabledProviders={enabledSocialProviders}
          callbackURL={buildCompleteProfileCallbackUrl(
            callbackUrl ?? "/dashboard",
          )}
          showLastUsed
        />
      ) : null}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>{t("auth.email")}</FormLabel>
                  {isEmailLastUsed ? <LastUsedInlineBadge /> : null}
                </div>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.email")}
                    disabled={loading || needsVerification}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.password")}
                    disabled={loading || needsVerification}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {needsVerification && (
            <div className="flex flex-col gap-3">
              <p className="text-base font-medium text-destructive">
                {t("auth.verification.notVerified")}
              </p>
              <div className="flex flex-col gap-2 w-full">
                <FormLabel>{t("auth.verification.otpLabel")}</FormLabel>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={verificationLoading}
                  containerClassName="justify-center"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (otp.length === 6 && !verificationLoading)
                      void onVerifyEmail();
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                disabled={verificationLoading || otp.length !== 6}
                className="ml-auto w-full"
                type="button"
                onClick={onVerifyEmail}
                variant="primary"
              >
                {verificationLoading && <Spinner />}
                {t("auth.verification.verify")}
              </Button>
              <Button
                disabled={sendingOtp || verificationLoading}
                className="ml-auto w-full"
                type="button"
                onClick={() => sendVerificationOtp(form.getValues("email"))}
                variant="outline"
              >
                {sendingOtp && <Spinner />}
                {t("auth.verification.resendVerificationEmail")}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-base font-medium text-destructive">
              {t("auth.email_or_password_incorrect")}
            </p>
          )}

          {!needsVerification && (
            <Button
              disabled={loading}
              className="ml-auto w-full"
              type="submit"
              variant="brand-dark"
            >
              {loading && <Spinner />}
              {t("auth.signIn")}
            </Button>
          )}
        </form>
      </Form>

      <div className="text-center w-full text-base">
        {t.rich("auth.forgotPasswordLink", {
          link: (chunks: any) => (
            <Link
              href="/auth/forgot-password"
              className="ml-auto w-full"
              variant="underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>

      <div className="text-center w-full text-base">
        {t.rich("auth.sign_in_sign_up_link", {
          link: (chunks: any) => (
            <Link
              href="/auth/signup"
              className="ml-auto w-full"
              variant="underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
    </div>
  );
};
