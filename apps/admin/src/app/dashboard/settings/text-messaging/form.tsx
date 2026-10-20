"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  SmsOptInPreview,
  type SmsOptInPreviewProps,
} from "@hacado/page-builder/opt-in-preview";
import {
  smsRegistrationFormSchema,
  type SmsEntityType,
  type SmsRegistrationInput,
  type SmsRegistrationView,
} from "@hacado/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Combobox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Input,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toastPromise,
} from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
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
  "SOLE_PROPRIETOR",
  "NON_PROFIT",
];

export const TextMessagingSettingsForm = ({
  values,
  requiresVerification,
  preview,
  country,
}: {
  values: SmsRegistrationView;
  requiresVerification: boolean;
  preview: SmsOptInPreviewProps;
  country: string;
}) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const form = useForm<SmsRegistrationInput>({
    resolver: zodResolver(
      smsRegistrationFormSchema(requiresVerification),
    ) as Resolver<SmsRegistrationInput>,
    mode: "onSubmit",
    values: {
      enabled: values.enabled,
      entityType: values.entityType,
      legalName: values.legalName,
      doingBusinessAs: values.doingBusinessAs,
      businessRegistrationNumber: values.businessRegistrationNumber,
      website: values.website,
      address: values.address,
      contactFirstName: values.contactFirstName,
      contactLastName: values.contactLastName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
    },
  });

  const entityType = form.watch("entityType");
  const enabled = form.watch("enabled");
  const submitted = values.status !== "draft";
  const preparing = values.blockedReason === "number_preparing";
  const locked =
    values.status === "pending" || (values.status === "verified" && !editing);

  const onSubmit = async (data: SmsRegistrationInput) => {
    setLoading(true);
    try {
      const resubmit =
        requiresVerification &&
        data.enabled &&
        (values.status !== "verified" || editing);
      const optInImage = resubmit ? await captureOptInPreview() : undefined;
      const result = await toastPromise(
        adminApi.textMessaging.saveTextMessaging({
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

      if (result.outcome === "submitted") setEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      {requiresVerification && enabled ? (
        <SmsOptInPreview {...preview} />
      ) : null}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  disabled={loading || locked}
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
        {requiresVerification && (enabled || submitted || preparing) ? (
          <div className="space-y-4 rounded-lg border p-4">
            {values.status === "pending" ? (
              <p className="text-sm text-muted-foreground">
                {t("settings.textMessaging.status.pending")}
              </p>
            ) : null}
            {values.status === "verified" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("settings.textMessaging.status.verified")}
                </p>
                {editing ? null : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    {t("settings.textMessaging.form.unlock")}
                  </Button>
                )}
              </div>
            ) : null}
            {values.status === "rejected" ? (
              <p className="text-sm text-destructive">
                {values.rejectionReason ||
                  t("settings.textMessaging.status.rejected")}
              </p>
            ) : null}
            {preparing ? (
              <p className="text-sm text-muted-foreground">
                {t("settings.textMessaging.status.preparing")}
              </p>
            ) : null}
            {enabled ? (
              <>
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
                        disabled={loading || locked}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {entityTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(
                                `settings.textMessaging.form.entityType.${type}`,
                              )}
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
                        <Input {...field} disabled={loading || locked} />
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
                          disabled={loading || locked}
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
                        {t(
                          "settings.textMessaging.form.registrationNumber.label",
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={loading || locked}
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
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator required>
                        {t("settings.textMessaging.form.website.label")}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={loading || locked}
                        />
                      </FormControl>
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
                          disabled={loading || locked}
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
                          disabled={loading || locked}
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
                            disabled={loading || locked}
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
                            values={smsAddressRegionOptions(
                              country,
                              field.value,
                            )}
                            disabled={loading || locked}
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
                            disabled={loading || locked}
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
                          {t(
                            "settings.textMessaging.form.contactFirstName.label",
                          )}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading || locked}
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
                          {t(
                            "settings.textMessaging.form.contactLastName.label",
                          )}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={loading || locked}
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
                          disabled={loading || locked}
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
                          disabled={loading || locked}
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
              </>
            ) : null}
          </div>
        ) : null}
        {locked ? null : (
          <SaveButton
            form={form}
            disabled={loading}
            isLoading={loading}
            text={t("settings.textMessaging.form.submit")}
          />
        )}
      </form>
    </Form>
  );
};
