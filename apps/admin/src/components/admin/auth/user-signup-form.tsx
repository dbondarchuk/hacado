"use client";
import { authClient } from "@/app/auth-client";
import { saveSignupMemberProfile } from "@/components/admin/auth/save-signup-member-profile";
import {
  captchaFetchOptions,
  isCaptchaError,
  TurnstileField,
  useTurnstileField,
} from "@/components/admin/auth/turnstile-field";
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
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const UserSignupForm = ({
  publicDomain,
  invitation,
  turnstileSiteKey,
}: {
  publicDomain: string;
  invitation?: {
    id: string;
    email: string;
    organizationName: string;
  } | null;
  turnstileSiteKey: string;
}) => {
  const formSchema = useMemo(
    () =>
      z
        .object({
          email: zEmail,
          phone: zPhone,
          language: z.enum(languages, {
            error:
              "admin.auth.validation.language.invalid" satisfies BaseAllKeys,
          }),
          name: z
            .string({
              error:
                "admin.auth.validation.name.required" satisfies BaseAllKeys,
            })
            .min(1, {
              error:
                "admin.auth.validation.name.required" satisfies BaseAllKeys,
            })
            .max(256, {
              error: "admin.auth.validation.name.max" satisfies BaseAllKeys,
            }),
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

  type UserFormValue = z.infer<typeof formSchema>;

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");

  const postAuthPath = invitation ? "/dashboard" : (callbackUrl ?? "/checkout");

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: invitation?.email ?? "",
      name: "",
      password: "",
      confirmPassword: "",
      language: "en",
      phone: "",
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const turnstile = useTurnstileField();

  const onSubmit = async (data: UserFormValue) => {
    const captchaToken = turnstile.token;
    if (!captchaToken) {
      toast.error(t("auth.captcha.error"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const email = invitation?.email ?? data.email;
      const response = await authClient.signUp.email({
        email,
        password: data.password,
        name: data.name,
        callbackURL: postAuthPath,
        fetchOptions: captchaFetchOptions(captchaToken),
      });

      if (response.error?.message) {
        if (response.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          toast.error(t("auth.signUp.toasts.userAlreadyExists"));
        } else if (isCaptchaError(response.error)) {
          toast.error(t("auth.captcha.error"));
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
        await saveSignupMemberProfile({
          userId: response.data.user.id,
          email,
          name: data.name,
          phone: data.phone,
          language: data.language,
        });

        toast.success(t("auth.signUp.toasts.success"));
        router.push(postAuthPath);
      }
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
            control={form.control}
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
            control={form.control}
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

          <FormField
            control={form.control}
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
            control={form.control}
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

          <FormField
            control={form.control}
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

          <TurnstileField
            siteKey={turnstileSiteKey}
            widgetRef={turnstile.widgetRef}
            onTokenChange={turnstile.setToken}
          />

          <Button
            disabled={loading || !turnstile.token}
            className="ml-auto w-full"
            type="submit"
          >
            {t("auth.signUp.submit")}
          </Button>
        </form>
      </Form>
      <div className="text-center w-full text-base">
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
    </div>
  );
};
