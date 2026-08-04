"use client";

import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps } from "@timelish/types";
import {
  Button,
  Checkbox,
  DurationInput,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { PaypalApp } from "./app";
import {
  paypalButtonColor,
  paypalButtonLayout,
  paypalButtonsShape,
  PaypalConfiguration,
  paypalConfigurationSchema,
} from "./models";
import {
  PaypalAdminKeys,
  PaypalAdminNamespace,
  paypalAdminNamespace,
} from "./translations/types";

export const PaypalAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,

  onError,

  appId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<PaypalConfiguration>({
      appId,
      appName: PaypalApp.name,
      schema: paypalConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<PaypalAdminNamespace, PaypalAdminKeys>(
    paypalAdminNamespace,
  );

  const isInStoreSyncEnabled = form.watch("enableInStoreSync");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.clientId.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.clientId.placeholder")}
                      autoComplete="off"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.secretKey.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.secretKey.placeholder")}
                      autoComplete="off"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buttonStyle.color"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.buttonStyle.color.label")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("form.selectPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {paypalButtonColor.map((color) => (
                          <SelectItem key={color} value={color}>
                            {t(`form.buttonStyle.color.values.${color}`)}
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
              name="buttonStyle.shape"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.buttonStyle.shape.label")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("form.selectPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {paypalButtonsShape.map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {t(`form.buttonStyle.shape.values.${shape}`)}
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
              name="buttonStyle.layout"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.buttonStyle.layout.label")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("form.selectPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {paypalButtonLayout.map((layout) => (
                          <SelectItem key={layout} value={layout}>
                            {t(`form.buttonStyle.layout.values.${layout}`)}
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
              name="buttonStyle.label"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.buttonStyle.label.label")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("form.selectPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pay">
                          {t(`form.buttonStyle.label.values.pay`)}
                        </SelectItem>
                        <SelectItem value="paypal">
                          {t(`form.buttonStyle.label.values.paypal`)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableGooglePay"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        id="enableGooglePay"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel
                      className="cursor-pointer"
                      htmlFor="enableGooglePay"
                    >
                      {t("form.googlePay.label")}
                    </FormLabel>
                  </div>
                  <FormDescription>
                    {t.rich("form.googlePay.description", {
                      link: (chunks: React.ReactNode) => (
                        <a
                          href="https://developer.paypal.com/docs/checkout/apm/google-pay/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableApplePay"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        id="enableApplePay"
                      />
                    </FormControl>
                    <FormLabel
                      className="cursor-pointer"
                      htmlFor="enableApplePay"
                    >
                      {t("form.applePay.label")}
                    </FormLabel>
                  </div>
                  <FormDescription>
                    {t.rich("form.applePay.description", {
                      link: (chunks: React.ReactNode) => (
                        <a
                          href="https://developer.paypal.com/docs/checkout/apm/apple-pay/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableInStoreSync"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        id="enableInStoreSync"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel
                      className="cursor-pointer"
                      htmlFor="enableInStoreSync"
                    >
                      {t("form.inStoreSync.label")}
                    </FormLabel>
                  </div>
                  <FormDescription>
                    {t("form.inStoreSync.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isInStoreSyncEnabled && (
              <FormField
                control={form.control}
                name="matchWindowMinutes"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t("form.matchWindow.label")}</FormLabel>
                    <FormControl>
                      <DurationInput
                        type="hours-minutes"
                        value={field.value ?? 0}
                        disabled={isLoading}
                        placeholderHours="2"
                        placeholderMinutes="0"
                        onBlur={field.onBlur}
                        onChange={(val) => {
                          field.onChange(val ?? 0);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.matchWindow.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              disabled={isLoading || !isValid}
              type="submit"
              variant="default"
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich("form.connectWith", {
                  app: () => (
                    <ConnectedAppNameAndLogo appName={PaypalApp.name} />
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
