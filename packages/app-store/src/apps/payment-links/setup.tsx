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
  Input,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  Switch,
  toast,
  toastPromise,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  TemplateSelector,
} from "@hacado/ui-admin";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { PaymentLinksApp } from "./app";
import {
  PaymentLinksSettings,
  paymentLinksSettingsSchema,
  paymentLinksVerificationModes,
} from "./models";
import {
  PaymentLinksAdminKeys,
  PaymentLinksAdminNamespace,
  paymentLinksAdminNamespace,
} from "./translations/types";

const ComboboxLoader: React.FC = () => (
  <div className="flex flex-row items-center gap-2 py-2 px-2 w-full">
    <Skeleton className="h-5 w-40" />
  </div>
);

const DEFAULT_INSTALL_SETTINGS: PaymentLinksSettings = {
  verification: "none",
  tipsEnabled: false,
  tipPresets: [],
};

export const PaymentLinksAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const [connectedAppId, setConnectedAppId] = React.useState(existingAppId);
  const [hasPaymentApp, setHasPaymentApp] = React.useState<boolean | null>(
    existingAppId ? true : null,
  );

  const tApps = useI18n("apps");
  const {
    appStatus,
    form,
    isLoading,
    isDataLoading,
    isValid,
    onSubmit,
    setIsLoading,
  } = useConnectedAppSetup<PaymentLinksSettings>({
    appId: connectedAppId,
    appName: PaymentLinksApp.name,
    schema: paymentLinksSettingsSchema,
    onSuccess: (appId) => {
      onSuccess(appId);
    },
    onError,
    initialData: DEFAULT_INSTALL_SETTINGS,
  });

  const t = useI18n<PaymentLinksAdminNamespace, PaymentLinksAdminKeys>(
    paymentLinksAdminNamespace,
  );

  const tipsEnabled = form.watch("tipsEnabled");
  const tipPresets = form.watch("tipPresets") ?? [];

  React.useEffect(() => {
    if (connectedAppId) {
      return;
    }

    let cancelled = false;
    void adminApi.configuration
      .getConfiguration("defaultApps")
      .then((apps) => {
        if (!cancelled) {
          setHasPaymentApp(!!apps?.paymentAppId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasPaymentApp(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedAppId]);

  const onInstall = React.useCallback(async () => {
    if (!hasPaymentApp) {
      toast.error(t("form.paymentAppRequired"));
      return;
    }

    try {
      setIsLoading(true);
      // Install only — `install()` seeds templates + header/footer. Do not call
      // processRequest here or empty form values would overwrite seeded ids.
      const appId = await toastPromise(
        adminApi.apps.addNewApp(PaymentLinksApp.name),
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
  }, [hasPaymentApp, onError, onSuccess, setIsLoading, t, tApps]);

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

  // First-time install: one click. Templates and header/footer are seeded in
  // `install()`; settings form appears in the same dialog after.
  if (!connectedAppId) {
    const canConnect = hasPaymentApp === true;

    return (
      <>
        <div className="flex flex-col items-center gap-2 w-full">
          <Button
            disabled={isLoading || !canConnect}
            variant="default"
            className="inline-flex gap-2 items-center w-full"
            onClick={() => void onInstall()}
          >
            {(isLoading || hasPaymentApp === null) && <Spinner />}
            <span className="inline-flex gap-2 items-center">
              {t.rich("form.connect", {
                app: () => (
                  <ConnectedAppNameAndLogo appName={PaymentLinksApp.name} />
                ),
              })}
            </span>
          </Button>
          {hasPaymentApp === false && (
            <p className="text-sm text-muted-foreground text-center">
              {t("form.paymentAppRequired")}{" "}
              <Link href="/dashboard/apps/default">
                {t("form.paymentAppRequiredLink")}
              </Link>
            </p>
          )}
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="verification"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.verification.label")}</FormLabel>
                  <FormDescription>
                    {t("form.verification.description")}
                  </FormDescription>
                  <FormControl>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentLinksVerificationModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {t(`form.verification.values.${mode}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailTemplateId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.emailTemplateId.label")}</FormLabel>
                  <FormDescription>
                    {t("form.emailTemplateId.description")}
                  </FormDescription>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <TemplateSelector
                        type="email"
                        disabled={isLoading}
                        value={field.value}
                        onItemSelect={(value) => field.onChange(value)}
                        allowClear
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smsTemplateId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.smsTemplateId.label")}</FormLabel>
                  <FormDescription>
                    {t("form.smsTemplateId.description")}
                  </FormDescription>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <TemplateSelector
                        type="text-message"
                        disabled={isLoading}
                        value={field.value}
                        onItemSelect={(value) => field.onChange(value)}
                        allowClear
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkExpiryDays"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.linkExpiryDays.label")}</FormLabel>
                  <FormDescription>
                    {t("form.linkExpiryDays.description")}
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      disabled={isLoading}
                      placeholder={t("form.linkExpiryDays.placeholder")}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? undefined : Number(raw));
                      }}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                  <div className="space-y-0.5">
                    <FormLabel>{t("form.tipsEnabled.label")}</FormLabel>
                    <FormDescription>
                      {t("form.tipsEnabled.description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {tipsEnabled && (
              <div className="flex flex-col gap-3 w-full rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{t("form.tipPresets.label")}</FormLabel>
                  <FormDescription>
                    {t("form.tipPresets.description")}
                  </FormDescription>
                </div>
                {tipPresets.map((preset, index) => (
                  <FormField
                    key={`tip-preset-${index}`}
                    control={form.control}
                    name={`tipPresets.${index}` as const}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <div className="flex flex-row items-center gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              disabled={isLoading}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                field.onChange(
                                  raw === "" ? undefined : Number(raw),
                                );
                              }}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <span className="text-muted-foreground text-sm whitespace-nowrap">
                            {t("form.tipPresets.percentage")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                            aria-label={t("form.tipPresets.remove")}
                            onClick={() => {
                              const next = [...tipPresets];
                              next.splice(index, 1);
                              form.setValue("tipPresets", next, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                {tipPresets.length < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 self-start"
                    onClick={() => {
                      form.setValue("tipPresets", [...tipPresets, 15], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <Plus className="size-4" />
                    {t("form.tipPresets.add")}
                  </Button>
                )}
              </div>
            )}
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
                    <ConnectedAppNameAndLogo appName={PaymentLinksApp.name} />
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
