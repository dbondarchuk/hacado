"use client";

import { textMessagingApi } from "@hacado/api-sdk/admin/text-messaging";
import { useI18n } from "@hacado/i18n/client";
import {
  SmsOptInPreview,
  type SmsOptInPreviewProps,
} from "@hacado/page-builder/opt-in-preview";
import type {
  SmsEntityType,
  SmsRegistrationInput,
  SmsRegistrationView,
} from "@hacado/types/text-message/registration";
import {
  smsRegistrationInputSchema,
  smsVerificationFormSchema,
} from "@hacado/types/text-message/registration";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Alert, AlertDescription } from "@hacado/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@hacado/ui/alert-dialog";
import { Combobox } from "@hacado/ui/combobox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Input } from "@hacado/ui/input";
import { PhoneInput } from "@hacado/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui/select";
import { toastPromise } from "@hacado/ui/sonner";
import { Switch } from "@hacado/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import {
  canonicalSmsAddressRegion,
  smsAddressRegionOptions,
} from "./address-regions";
import { captureOptInPreview } from "./capture-opt-in-preview";

const entityTypes: SmsEntityType[] = [
  "PRIVATE_PROFIT",
  "PUBLIC_PROFIT",
  "SOLE_PROPRIETOR",
  "NON_PROFIT",
];

export const TextMessagingVerificationForm = ({
  values,
  smsEnabled,
  preview,
  country,
  phoneNumber,
  hasTextMessageSenderApp = false,
}: {
  values: SmsRegistrationView;
  smsEnabled: boolean;
  preview: SmsOptInPreviewProps;
  country: string;
  phoneNumber?: string;
  hasTextMessageSenderApp?: boolean;
}) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const form = useForm<SmsRegistrationInput>({
    resolver: zodResolver(
      hasTextMessageSenderApp
        ? smsRegistrationInputSchema
        : smsVerificationFormSchema,
    ) as Resolver<SmsRegistrationInput>,
    mode: "all",
    reValidateMode: "onChange",
    values: {
      enabled: values.enabled,
      entityType: values.entityType,
      legalName: values.legalName,
      doingBusinessAs: values.doingBusinessAs,
      businessRegistrationNumber: values.businessRegistrationNumber,
      address: values.address,
      contactFirstName: values.contactFirstName,
      contactLastName: values.contactLastName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
    },
  });

  const entityType = form.watch("entityType");
  const customEnabled = form.watch("enabled");
  const legalName = form.watch("legalName");
  const doingBusinessAs = form.watch("doingBusinessAs");
  const optInBusinessTitle =
    doingBusinessAs?.trim() || legalName?.trim() || values.legalName || "";

  const showVerificationDetails = customEnabled && !hasTextMessageSenderApp;
  const preparing = values.blockedReason === "number_preparing";
  const fieldsLocked =
    !smsEnabled ||
    preparing ||
    values.status === "pending" ||
    values.status === "verified";

  const toggleLocked = !smsEnabled || preparing || values.status === "pending";

  const statusVariant =
    values.status === "rejected"
      ? "destructive"
      : values.status === "verified"
        ? "success"
        : "warning";

  const statusMessage =
    values.status === "rejected"
      ? values.rejectionReason || t("settings.textMessaging.status.rejected")
      : preparing && values.status === "draft"
        ? t("settings.textMessaging.status.preparing")
        : values.status === "pending"
          ? t("settings.textMessaging.status.pending")
          : values.status === "verified"
            ? phoneNumber
              ? t("settings.textMessaging.status.verifiedWithNumber", {
                  number: phoneNumber,
                })
              : t("settings.textMessaging.status.verified")
            : null;

  const onSubmit = async (data: SmsRegistrationInput) => {
    if (!smsEnabled) return;

    setLoading(true);
    try {
      const resubmit =
        !hasTextMessageSenderApp &&
        data.enabled &&
        values.status !== "verified";

      const optInImage = resubmit ? await captureOptInPreview() : undefined;
      await toastPromise(
        textMessagingApi.saveSmsVerification({
          ...data,
          address: data.address
            ? {
                ...data.address,
                addressRegion: canonicalSmsAddressRegion(
                  country,
                  data.address.addressRegion,
                ),
              }
            : data.address,
          resubmit,
          optInImage,
        }),
        {
          success: (saved) =>
            saved.outcome === "preparing"
              ? t("settings.textMessaging.toasts.preparing")
              : saved.outcome === "submitted"
                ? t("settings.textMessaging.toasts.submitted")
                : t("settings.textMessaging.toasts.saved"),
          error: t("settings.textMessaging.toasts.error"),
        },
      );

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      {smsEnabled &&
      showVerificationDetails &&
      values.status !== "pending" &&
      values.status !== "verified" ? (
        <SmsOptInPreview {...preview} businessTitle={optInBusinessTitle} />
      ) : null}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {statusMessage ? (
          <Alert variant={statusVariant}>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <FormLabel>
                  {t("settings.textMessaging.form.enabled")}
                </FormLabel>
                <FormDescription>
                  {t("settings.textMessaging.form.enabledDescription")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    if (!checked && values.enabled) {
                      setConfirmOff(true);
                      return;
                    }

                    field.onChange(checked);
                  }}
                  disabled={loading || toggleLocked}
                />
              </FormControl>
              <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("settings.textMessaging.form.disableTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.textMessaging.form.disableDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">
                      {t("settings.textMessaging.form.disableCancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      onClick={() => {
                        field.onChange(false);
                        setConfirmOff(false);
                      }}
                    >
                      {t("settings.textMessaging.form.disableConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </FormItem>
          )}
        />
        {hasTextMessageSenderApp && customEnabled ? (
          <Alert>
            <AlertDescription>
              {t("settings.textMessaging.form.senderAppSkipsVerification")}
            </AlertDescription>
          </Alert>
        ) : null}
        {showVerificationDetails ? (
          <div className="space-y-4 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.textMessaging.form.entityType.label")}
                  </FormLabelWithRequiredIndicator>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || fieldsLocked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`settings.textMessaging.form.entityType.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.textMessaging.form.legalName.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input {...field} disabled={loading || fieldsLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doingBusinessAs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.textMessaging.form.doingBusinessAs.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("settings.textMessaging.form.doingBusinessAs.hint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator
                    required={entityType !== "SOLE_PROPRIETOR"}
                  >
                    {t("settings.textMessaging.form.registrationNumber.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                    />
                  </FormControl>
                  <FormDescription>
                    {entityType === "SOLE_PROPRIETOR"
                      ? t(
                          "settings.textMessaging.form.registrationNumber.soleHint",
                        )
                      : t(
                          "settings.textMessaging.form.registrationNumber.hint",
                        )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.streetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.textMessaging.form.streetAddress.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.textMessaging.form.addressLine2.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="address.addressLocality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.textMessaging.form.city.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading || fieldsLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.addressRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.textMessaging.form.state.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Combobox
                        className="w-full"
                        values={smsAddressRegionOptions(country, field.value)}
                        disabled={loading || fieldsLocked}
                        value={
                          canonicalSmsAddressRegion(country, field.value) ||
                          undefined
                        }
                        onItemSelect={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.textMessaging.form.postalCode.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading || fieldsLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.textMessaging.form.contactFirstName.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading || fieldsLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("settings.textMessaging.form.contactLastName.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading || fieldsLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.textMessaging.form.contactEmail.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.textMessaging.form.contactPhone.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      value={field.value ?? ""}
                      disabled={loading || fieldsLocked}
                      defaultCountry={country}
                      label={t(
                        "settings.textMessaging.form.contactPhone.label",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
        {toggleLocked ? null : (
          <SaveButton
            form={form}
            disabled={loading}
            isLoading={loading}
            ignoreDirty
            text={
              showVerificationDetails && values.status !== "verified"
                ? t("settings.textMessaging.form.submit")
                : t("settings.textMessaging.form.save")
            }
          />
        )}
      </form>
    </Form>
  );
};
