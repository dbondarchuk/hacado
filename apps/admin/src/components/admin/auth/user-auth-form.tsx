"use client";
import { authClient } from "@/app/auth-client";
import {
  GoogleAuthButton,
  LastUsedInlineBadge,
  SocialAuthDivider,
} from "@/components/admin/auth/social-auth-buttons";
import { buildCompleteProfileCallbackUrl } from "@/lib/auth/complete-profile-callback";
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
  googleAuthEnabled = false,
}: {
  googleAuthEnabled?: boolean;
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
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
        setVerificationError(true);
        setError(null);
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

  const onResendVerificationEmail = async () => {
    setVerificationLoading(true);
    setError(null);

    try {
      const response = await authClient.sendVerificationEmail({
        email: form.getValues("email"),
        callbackURL: "/auth/email/verified",
      });

      if (response.error?.message) {
        throw new Error(response.error.message);
      }

      setVerificationLoading(false);
      setVerificationSent(true);

      toast.success(t("auth.verification.success"));
    } catch (error: any) {
      console.error(error);
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
      {googleAuthEnabled ? (
        <>
          <GoogleAuthButton
            callbackURL={buildCompleteProfileCallbackUrl(
              callbackUrl ?? "/dashboard",
            )}
            showLastUsed
          />
          <SocialAuthDivider />
        </>
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
                    disabled={loading}
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
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {verificationError && (
            <div className="flex flex-col gap-2">
              <p className="text-base font-medium text-destructive">
                {t("auth.verification.notVerified")}
              </p>
              <Button
                disabled={verificationLoading}
                className="ml-auto w-full"
                type="button"
                onClick={onResendVerificationEmail}
                variant="primary"
              >
                {verificationLoading && <Spinner />}
                {t("auth.verification.resendVerificationEmail")}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-base font-medium text-destructive">
              {t("auth.email_or_password_incorrect")}
            </p>
          )}

          <Button
            disabled={loading}
            className="ml-auto w-full"
            type="submit"
            variant="brand-dark"
          >
            {loading && <Spinner />}
            {t("auth.signIn")}
          </Button>
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
