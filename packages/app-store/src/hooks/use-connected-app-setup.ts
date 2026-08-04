import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { ConnectedAppStatusWithText } from "@timelish/types";
import { toastPromise } from "@timelish/ui";
import React from "react";
import { FieldValues, useForm } from "react-hook-form";
import { ZodType } from "zod";

export type UseConnectedAppSetupProps<T extends FieldValues> = {
  appId?: string;
  appName: string;
  schema: ZodType<T, T>;
  successText?: string;
  errorText?: string;
  onSuccess?: (appId: string) => void;
  onError?: (error: string) => void;
  processDataForSubmit?: (data: T) => any;
  initialData?: T;
};

export function useConnectedAppSetup<T extends FieldValues>({
  appId: existingAppId,
  appName,
  schema,
  successText,
  errorText,
  onSuccess,
  onError,
  processDataForSubmit,
  initialData,
}: UseConnectedAppSetupProps<T>) {
  const t = useI18n("apps");
  const [appId, setAppId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const [appStatus, setAppStatus] =
    React.useState<ConnectedAppStatusWithText>();

  const [initialAppData, setInitialAppData] = React.useState<T>(
    initialData as any,
  );

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {} as any,
  });

  React.useEffect(() => {
    if (!existingAppId) return;

    const getInitialData = async () => {
      setIsDataLoading(true);
      setIsLoading(true);

      const data = await adminApi.apps.getAppData(existingAppId);
      setInitialAppData(data);

      form.reset(data);
      setIsDataLoading(false);
      setIsLoading(false);
    };
    setAppId(existingAppId);
    getInitialData();
  }, [existingAppId, form]);

  const onSubmit = async (data: T) => {
    try {
      setIsLoading(true);

      const promise = new Promise<{
        appId: string;
        status: ConnectedAppStatusWithText;
      }>(async (resolve, reject) => {
        const _appId = appId || (await adminApi.apps.addNewApp(appName));
        setAppId(_appId);

        const processedData = processDataForSubmit?.(data) || data;

        const status = (await adminApi.apps.processRequest(
          _appId,
          processedData,
        )) as ConnectedAppStatusWithText;

        setAppStatus(status);

        if (status.status === "failed") {
          reject(status.statusText);
          return;
        }

        if (status.status === "connected") {
          resolve({ appId: _appId, status });
          return;
        }

        reject(new Error("Unknown status"));
      });

      const { appId: resultAppId } = await toastPromise(promise, {
        success: {
          message: t("common.connectedAppSetup.success.title"),
          description:
            successText || t("common.connectedAppSetup.success.description"),
        },
        error: {
          message: t("common.connectedAppSetup.error.title"),
          description:
            errorText || t("common.connectedAppSetup.error.description"),
        },
      });

      onSuccess?.(resultAppId);
    } catch (e: any) {
      onError?.(e instanceof Error ? e.message : e?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const { isValid } = form.formState;

  return {
    appId,
    isLoading,
    isDataLoading,
    setIsDataLoading,
    setIsLoading,
    form,
    isValid,
    appStatus,
    onSubmit,
  };
}
