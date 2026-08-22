"use client";

import { saveSignupMemberProfile } from "@/components/admin/auth/save-signup-member-profile";
import { BaseAllKeys, languages, useI18n } from "@hacado/i18n/client";
import { zPhone } from "@hacado/types";
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
  PhoneInput,
  Spinner,
  toast,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export function CompleteProfileForm({
  defaultName,
  nextPath,
}: {
  defaultName: string;
  nextPath: string;
}) {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
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
        phone: zPhone,
        language: z.enum(languages, {
          error: "admin.auth.validation.language.invalid" satisfies BaseAllKeys,
        }),
      }),
    [],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName,
      phone: "",
      language: "en",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await saveSignupMemberProfile({
        name: data.name,
        phone: data.phone,
        language: data.language,
      });

      if (!result.ok) {
        toast.error(t("auth.completeProfile.toasts.error"));
        return;
      }

      toast.success(t("auth.completeProfile.toasts.success"));
      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
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

        <Button disabled={loading} className="ml-auto w-full" type="submit">
          {loading && <Spinner />}
          {t("auth.completeProfile.submit")}
        </Button>
      </form>
    </Form>
  );
}
