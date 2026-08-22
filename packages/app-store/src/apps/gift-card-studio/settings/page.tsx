"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  AutoSkeleton,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  MonthsInput,
  Switch,
  toastPromise,
  useCurrencySymbol,
} from "@hacado/ui";
import { SaveButton, TemplateSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getSettings, updateSettings } from "../actions";
import {
  GiftCardStudioSettings,
  giftCardStudioSettingsSchema,
} from "../models/settings";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../translations/types";

export const GiftCardStudioSettingsPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<GiftCardStudioSettings>({
    resolver: zodResolver(giftCardStudioSettingsSchema) as any,
    defaultValues: {
      notifyOwnerOnPurchase: false,
      emailTemplateIdToPurchaser: "",
      emailTemplateIdToRecipient: "",
      minAmount: 5,
      maxAmount: 100,
      expirationMonths: 12,
    },
  });

  useEffect(() => {
    getSettings(appId)
      .then((s: GiftCardStudioSettings) => {
        form.reset({
          notifyOwnerOnPurchase: s.notifyOwnerOnPurchase ?? false,
          emailTemplateIdToPurchaser: s.emailTemplateIdToPurchaser ?? "",
          emailTemplateIdToRecipient: s.emailTemplateIdToRecipient ?? "",
          minAmount: s.minAmount ?? 5,
          maxAmount: s.maxAmount ?? 100,
          expirationMonths: s.expirationMonths ?? 12,
        });
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, [appId, form]);

  const onSubmit = async (values: GiftCardStudioSettings) => {
    try {
      setLoading(true);
      await toastPromise(updateSettings(appId, values), {
        success: t("settings.toasts.saved"),
        error: t("settings.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutoSkeleton loading={initialLoading}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 max-w-xl"
        >
          <FormField
            control={form.control}
            name="notifyOwnerOnPurchase"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>
                    {t("settings.notifyOwnerOnPurchase.label")}
                  </FormLabel>
                  <FormDescription>
                    {t("settings.notifyOwnerOnPurchase.description")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading || initialLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailTemplateIdToPurchaser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.emailTemplateToPurchaser")}</FormLabel>
                <FormControl>
                  <TemplateSelector
                    type="email"
                    value={field.value ?? undefined}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailTemplateIdToRecipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.emailTemplateToRecipient")}</FormLabel>
                <FormControl>
                  <TemplateSelector
                    type="email"
                    value={field.value ?? undefined}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expirationMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.expirationMonths")}</FormLabel>
                <FormControl>
                  <MonthsInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      form.trigger("expirationMonths");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.minAmount")}</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      className={InputGroupAddonClasses({
                        variant: "prefix",
                      })}
                    >
                      {currencySymbol}
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        className={InputGroupInputClasses({
                          variant: "prefix",
                        })}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </InputGroupInput>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.maxAmount")}</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      className={InputGroupAddonClasses({
                        variant: "prefix",
                      })}
                    >
                      {currencySymbol}
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        {...field}
                        value={field.value ?? ""}
                        className={InputGroupInputClasses({
                          variant: "prefix",
                        })}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </InputGroupInput>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SaveButton form={form} isLoading={loading || initialLoading} />
        </form>
      </Form>
    </AutoSkeleton>
  );
};
