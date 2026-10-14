"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  Button,
  ComboboxAsync,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  Skeleton,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { MyCabinetApp } from "./app";
import { MyCabinetSettings, myCabinetSettingsSchema } from "./models";
import {
  MyCabinetAdminKeys,
  MyCabinetAdminNamespace,
  myCabinetAdminNamespace,
} from "./translations/types";

const ComboboxLoader: React.FC = () => (
  <div className="flex flex-row items-center gap-2 py-2 px-2 w-full">
    <Skeleton className="h-5 w-40" />
  </div>
);

const DEFAULT_INSTALL_SETTINGS: MyCabinetSettings = {};

export const MyCabinetAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const [connectedAppId, setConnectedAppId] = React.useState(existingAppId);
  const tApps = useI18n("apps");
  const {
    appStatus,
    form,
    isLoading,
    isDataLoading,
    isValid,
    onSubmit,
    setIsLoading,
  } = useConnectedAppSetup<MyCabinetSettings>({
    appId: connectedAppId,
    appName: MyCabinetApp.name,
    schema: myCabinetSettingsSchema,
    onSuccess: (appId) => {
      onSuccess(appId);
    },
    onError,
    initialData: DEFAULT_INSTALL_SETTINGS,
  });

  const t = useI18n<MyCabinetAdminNamespace, MyCabinetAdminKeys>(
    myCabinetAdminNamespace,
  );

  const onInstall = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Install only — `install()` seeds header/footer. Do not call
      // processRequest here or empty form values would overwrite seeded ids.
      const appId = await toastPromise(
        adminApi.apps.addNewApp(MyCabinetApp.name),
        {
          success: {
            message: tApps("common.connectedAppSetup.success.title"),
            description: tApps("common.connectedAppSetup.success.description"),
          },
          error: {
            message: tApps("common.connectedAppSetup.error.title"),
            description: tApps("common.connectedAppSetup.error.description"),
          },
        },
      );
      setConnectedAppId(appId);
      onSuccess(appId, true);
    } catch (e: any) {
      onError?.(e instanceof Error ? e.message : (e?.toString?.() ?? "error"));
    } finally {
      setIsLoading(false);
    }
  }, [onError, onSuccess, setIsLoading, tApps]);

  const fetchHeaders = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.pageHeaders.getPageHeaders({
        page,
        limit,
        search: search || undefined,
        priorityId: form.getValues("headerId")
          ? [form.getValues("headerId")!]
          : undefined,
      });

      return {
        items: (result.items ?? []).map(
          (item) =>
            ({
              label: item.name,
              shortLabel: item.name,
              value: item._id,
            }) satisfies IComboboxItem,
        ),
        hasMore: page * limit < result.total,
      };
    },
    [form],
  );

  const fetchFooters = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.pageFooters.getPageFooters({
        page,
        limit,
        search: search || undefined,
        priorityId: form.getValues("footerId")
          ? [form.getValues("footerId")!]
          : undefined,
      });

      return {
        items: (result.items ?? []).map(
          (item) =>
            ({
              label: item.name,
              shortLabel: item.name,
              value: item._id,
            }) satisfies IComboboxItem,
        ),
        hasMore: page * limit < result.total,
      };
    },
    [form],
  );

  if (!connectedAppId) {
    return (
      <>
        <div className="flex flex-col items-center gap-2 w-full">
          <Button
            disabled={isLoading}
            variant="default"
            className="inline-flex gap-2 items-center w-full"
            onClick={() => void onInstall()}
          >
            {isLoading && <Spinner />}
            <span className="inline-flex gap-2 items-center">
              {t.rich("form.connect", {
                app: () => (
                  <ConnectedAppNameAndLogo appName={MyCabinetApp.name} />
                ),
              })}
            </span>
          </Button>
        </div>
        {appStatus && (
          <ConnectedAppStatusMessage
            status={appStatus.status}
            statusText={appStatus.statusText}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-2 w-full"
        >
          <div className="flex flex-col gap-4 w-full">
            <FormField
              control={form.control}
              name="headerId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.headerId.label")}</FormLabel>
                  <FormDescription>
                    {t("form.headerId.description")}
                  </FormDescription>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <ComboboxAsync
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        allowClear
                        placeholder={t("form.headerId.placeholder")}
                        fetchItems={fetchHeaders}
                        loader={<ComboboxLoader />}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footerId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.footerId.label")}</FormLabel>
                  <FormDescription>
                    {t("form.footerId.description")}
                  </FormDescription>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <ComboboxAsync
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        allowClear
                        placeholder={t("form.footerId.placeholder")}
                        fetchItems={fetchFooters}
                        loader={<ComboboxLoader />}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="default"
              disabled={isLoading || !isValid}
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich("form.update", {
                  app: () => (
                    <ConnectedAppNameAndLogo appName={MyCabinetApp.name} />
                  ),
                })}
              </span>
            </Button>
          </div>
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
