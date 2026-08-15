"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton, Form } from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
import { ZodType } from "zod";
import { useConnectedAppSetup } from "../../../../hooks/use-connected-app-setup";
import { BlogApp } from "../../app";
import { BlogConfigurationFormFields } from "../../configuration-form-fields";
import { BlogConfiguration, blogConfigurationSchema } from "../../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../../translations/types";

export const BlogSettingsPage: React.FC<{ appId: string }> = ({ appId }) => {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  const { form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<BlogConfiguration>({
      appId,
      appName: BlogApp.name,
      schema: blogConfigurationSchema as ZodType<
        BlogConfiguration,
        BlogConfiguration
      >,
      initialData: {
        commentsEnabled: false,
        commentsPremoderation: true,
        sendEmailOnNewComment: false,
      },
      processDataForSubmit: (data) => ({
        type: "set-configuration",
        configuration: data,
      }),
      successText: t("settings.toasts.saved"),
      errorText: t("settings.toasts.error"),
    });

  return (
    <AutoSkeleton loading={isDataLoading}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <BlogConfigurationFormFields form={form} isLoading={isLoading} />
          <SaveButton form={form} isLoading={isLoading || isDataLoading} />
        </form>
      </Form>
    </AutoSkeleton>
  );
};
