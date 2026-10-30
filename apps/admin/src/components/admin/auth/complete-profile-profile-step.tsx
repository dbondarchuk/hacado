"use client";

import { languages, useI18n } from "@hacado/i18n/client";
import type { BaseAllKeys } from "@hacado/i18n/keys";
import { Button } from "@hacado/ui/button";
import { Combobox } from "@hacado/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Input } from "@hacado/ui/input";
import { Spinner } from "@hacado/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const profileSchema = z.object({
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
  language: z.enum(languages, {
    error: "admin.auth.validation.language.invalid" satisfies BaseAllKeys,
  }),
});

export type CompleteProfileProfileValues = z.infer<typeof profileSchema>;

export function CompleteProfileProfileStep({
  defaultName,
  disabled,
  onContinue,
}: {
  defaultName: string;
  disabled?: boolean;
  onContinue: (data: CompleteProfileProfileValues) => void;
}) {
  const t = useI18n("admin");
  const form = useForm<CompleteProfileProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      name: defaultName,
      language: "en",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onContinue)}
        className="w-full space-y-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithRequiredIndicator required>
                {t("auth.signUp.name")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <Input
                  placeholder={t("auth.signUp.namePlaceholder")}
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={disabled} className="ml-auto w-full" type="submit">
          {disabled && <Spinner />}
          {t("auth.completeProfile.submit")}
        </Button>
      </form>
    </Form>
  );
}
