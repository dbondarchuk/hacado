"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import { Button, Form, Spinner } from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { ZodType } from "zod";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { BlogApp } from "./app";
import { BlogConfigurationFormFields } from "./configuration-form-fields";
import { BlogConfiguration, blogConfigurationSchema } from "./models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "./translations/types";

export const BlogAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<BlogConfiguration>({
      appId: existingAppId,
      appName: BlogApp.name,
      schema: blogConfigurationSchema as ZodType<
        BlogConfiguration,
        BlogConfiguration
      >,
      onSuccess,
      onError,
      initialData: {
        commentsEnabled: false,
        commentsPremoderation: true,
        sendEmailOnNewComment: false,
      },
      processDataForSubmit: (data) => ({
        type: "set-configuration",
        configuration: data,
      }),
    });

  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <BlogConfigurationFormFields form={form} isLoading={isLoading} />
          <Button
            type="submit"
            variant="default"
            disabled={isLoading || !isValid}
            className="inline-flex gap-2 items-center w-full"
          >
            {isLoading && <Spinner />}
            <span className="inline-flex gap-2 items-center">
              {t.rich("setup.update", {
                app: () => (
                  <ConnectedAppNameAndLogo
                    appName={BlogApp.name}
                    logoClassName="w-4 h-4"
                  />
                ),
              })}
            </span>
          </Button>
        </form>
      </Form>
      {appStatus && (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      )}
    </>
  );
};
