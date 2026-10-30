"use client";

import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import type { OrganizationBillingSubscriptionDetails } from "@hacado/types/billing";
import type { PostalAddress } from "@hacado/types/utils";
import {
  businessIndustryDefinitions,
  countryOptions,
  Currency,
  currencyOptions,
  CurrencySymbolMap,
} from "@hacado/types/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  IComboboxItem,
  Input,
  PhoneInput,
} from "@hacado/ui";
import { AddressAutocomplete, SwitchCardFormItem } from "@hacado/ui-admin";
import { getTimeZones } from "@vvo/tzdb";
import { UseFormReturn } from "react-hook-form";
import { SiteSettingsFormValues } from "../site-settings-schema";
import { GeneralBillingCard } from "./general-billing-card";

const timeZoneValues: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  value: zone.name,
}));

export const GeneralTab: React.FC<{
  form: UseFormReturn<SiteSettingsFormValues>;
  loading: boolean;
  billingSubscriptionDetails: OrganizationBillingSubscriptionDetails;
}> = ({ form, loading, billingSubscriptionDetails }) => {
  const t = useI18n("admin");
  const tUI = useI18n("ui");

  const applyAddressSuggestion = (address: PostalAddress) => {
    form.setValue(
      "general.address.streetAddress",
      address.streetAddress ?? "",
      {
        shouldDirty: true,
      },
    );

    form.setValue("general.address.addressLine2", address.addressLine2 ?? "", {
      shouldDirty: true,
    });

    form.setValue(
      "general.address.addressLocality",
      address.addressLocality ?? "",
      { shouldDirty: true },
    );

    form.setValue(
      "general.address.addressRegion",
      address.addressRegion ?? "",
      {
        shouldDirty: true,
      },
    );

    form.setValue("general.address.postalCode", address.postalCode ?? "", {
      shouldDirty: true,
    });

    if (address.addressCountry) {
      form.setValue("general.country", address.addressCountry, {
        shouldDirty: true,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("navigation.general")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 gap-2 md:gap-4 flex flex-col">
          <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
            <FormField
              control={form.control}
              name="general.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.general.form.name")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("settings.general.form.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("settings.general.form.nameDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.industry")}</FormLabel>
                  <FormControl>
                    <Combobox
                      useCategories
                      values={businessIndustryDefinitions.map((industry) => ({
                        label: tUI(`industry.${industry.id}`),
                        value: industry.id,
                        category: tUI(`industry.category.${industry.category}`),
                      }))}
                      searchLabel={t(
                        "settings.general.form.industryPlaceholder",
                      )}
                      disabled={loading}
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("settings.general.form.industryTooltip")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.general.form.email")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      disabled={loading}
                      type="email"
                      placeholder={t("settings.general.form.emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.phone")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      disabled={loading}
                      label={t("settings.general.form.phone")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="general.timeZone"
            render={({ field }) => (
              <FormItem>
                <FormLabelWithRequiredIndicator required>
                  {t("settings.general.form.timeZone")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <Combobox
                    className="flex w-full font-normal text-lg"
                    values={timeZoneValues}
                    searchLabel={t("settings.general.form.selectTimeZone")}
                    disabled={loading}
                    customSearch={(search) =>
                      timeZoneValues.filter(
                        (zone) =>
                          (zone.label as string)
                            .toLocaleLowerCase()
                            .indexOf(search.toLocaleLowerCase()) >= 0,
                      )
                    }
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormDescription>
                  {t("settings.general.form.timeZoneDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="general.useClientTimezone"
            render={({ field }) => (
              <SwitchCardFormItem
                label={t("settings.general.form.useClientTimezone")}
                description={
                  <I18nRichText
                    namespace="admin"
                    text="settings.general.form.useClientTimezoneTooltip"
                  />
                }
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={loading}
              />
            )}
          />
          <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
            <FormField
              control={form.control}
              name="general.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.general.form.country")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Combobox
                      values={countryOptions.map((country) => ({
                        label: tUI(`country.${country}`),
                        value: country,
                      }))}
                      disabled={loading}
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t("settings.general.form.currency")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Combobox
                      values={currencyOptions.map((currency: Currency) => ({
                        label: t("settings.general.form.currencyLabelFormat", {
                          currency: tUI(`currency.${currency}`),
                          code: currency,
                          symbol: CurrencySymbolMap[currency],
                        }),
                        value: currency,
                      }))}
                      disabled={loading}
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address.streetAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-col gap-2">
                  <FormLabel>
                    {t("settings.general.form.streetAddress")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.streetAddressPlaceholder",
                      )}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("settings.general.form.addressTooltip")}
                  </FormDescription>
                  <FormMessage />
                  <AddressAutocomplete
                    disabled={loading}
                    countryBias={form.watch("general.country")}
                    onSelect={applyAddressSuggestion}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address.addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.general.form.addressLine2")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.addressLine2Placeholder",
                      )}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address.addressLocality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.general.form.addressLocality")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.addressLocalityPlaceholder",
                      )}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address.addressRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.general.form.addressRegion")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.addressRegionPlaceholder",
                      )}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.postalCode")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.postalCodePlaceholder",
                      )}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      <GeneralBillingCard details={billingSubscriptionDetails} />
    </>
  );
};
