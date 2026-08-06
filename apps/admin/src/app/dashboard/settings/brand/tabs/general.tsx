"use client";

import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import type { OrganizationBillingSubscriptionDetails } from "@hacado/types";
import {
  countryOptions,
  Currency,
  currencyOptions,
  CurrencySymbolMap,
} from "@hacado/types";
import {
  BooleanSelect,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  InfoTooltip,
  Input,
  PhoneInput,
} from "@hacado/ui";
import { UseFormReturn } from "react-hook-form";
import { SiteSettingsFormValues } from "../site-settings-schema";
import { GeneralBillingCard } from "./general-billing-card";

export const GeneralTab: React.FC<{
  form: UseFormReturn<SiteSettingsFormValues>;
  loading: boolean;
  timeZoneValues: IComboboxItem[];
  billingSubscriptionDetails: OrganizationBillingSubscriptionDetails;
}> = ({ form, loading, timeZoneValues, billingSubscriptionDetails }) => {
  const t = useI18n("admin");
  const tUI = useI18n("ui");

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("navigation.general")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
            <FormField
              control={form.control}
              name="general.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.name")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("settings.general.form.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.general.form.address")}{" "}
                    <InfoTooltip>
                      {t("settings.general.form.addressTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t(
                        "settings.general.form.addressPlaceholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.email")}</FormLabel>
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
            <FormField
              control={form.control}
              name="general.timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.timeZone")}</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.useClientTimezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.general.form.useClientTimezone")}{" "}
                    <InfoTooltip>
                      <I18nRichText
                        namespace="admin"
                        text="settings.general.form.useClientTimezoneTooltip"
                      />
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="general.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.general.form.country")}</FormLabel>
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
                  <FormLabel>{t("settings.general.form.currency")}</FormLabel>
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
          </div>
        </CardContent>
      </Card>
      <GeneralBillingCard details={billingSubscriptionDetails} />
    </>
  );
};
