"use client";
import { authClient } from "@/app/auth-client";
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: zEmail,
});

type UserFormValue = z.infer<typeof formSchema>;
const defaultValues: UserFormValue = {
  email: "",
};

export const UserForgotPasswordForm = ({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) => {
  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");
  const turnstile = useTurnstileField();

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: UserFormValue) => {
    const captchaToken = turnstile.token;
    if (!captchaToken) {
      toast.error(t("auth.captcha.error"));
      return;
    }

    setLoading(true);
    try {
      const response = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/auth/reset-password",
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
    } finally {
      turnstile.reset();
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
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
                <FormLabel>{t("auth.forgotPassword.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("auth.forgotPassword.email")}
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
    </div>
  );
};
