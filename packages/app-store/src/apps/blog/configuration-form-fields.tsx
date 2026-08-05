"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Switch,
} from "@hacado/ui";
import { UseFormReturn } from "react-hook-form";
import { BlogConfiguration } from "./models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "./translations/types";

type BlogConfigurationFormFieldsProps = {
  form: UseFormReturn<BlogConfiguration>;
  isLoading?: boolean;
};

export const BlogConfigurationFormFields = ({
  form,
  isLoading,
}: BlogConfigurationFormFieldsProps) => {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const commentsEnabled = form.watch("commentsEnabled");

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <FormField
        control={form.control}
        name="commentsEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>{t("setup.commentsEnabled.label")}</FormLabel>
              <FormDescription>
                {t("setup.commentsEnabled.description")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="commentsPremoderation"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>{t("setup.commentsPremoderation.label")}</FormLabel>
              <FormDescription>
                {t("setup.commentsPremoderation.description")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading || !commentsEnabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="sendEmailOnNewComment"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>{t("setup.sendEmailOnNewComment.label")}</FormLabel>
              <FormDescription>
                {t("setup.sendEmailOnNewComment.description")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading || !commentsEnabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
