"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@timelish/i18n/client";
import type { OrganizationBillingSubscriptionDetails } from "@timelish/types";
import { BillingPlanTier } from "@timelish/types";
import {
  Form,
  IComboboxItem,
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
  toastPromise,
} from "@timelish/ui";
import { SaveButton } from "@timelish/ui-admin";
import { getTimeZones } from "@vvo/tzdb";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { saveSiteSettingsAction } from "./actions";
import {
  siteSettingsFormSchema,
  SiteSettingsFormValues,
} from "./site-settings-schema";
import { BrandTab } from "./tabs/brand";
import { GeneralTab } from "./tabs/general";
import { SocialTab } from "./tabs/social";
import { StylingTab } from "./tabs/styling";

const timeZoneValues: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  shortLabel: `${zone.alternativeName}`,
  value: zone.name,
}));
export const SiteSettingsForm: React.FC<{
  values: SiteSettingsFormValues;
  initialBrandLanguage: string;
  customDomain?: string;
  organizationSlug: string;
  websiteUrl: string;
  timeliBaseHost: string;
  timeliBaseUrl: string;
  customDomainARecordIp?: string;
  billingSubscriptionDetails: OrganizationBillingSubscriptionDetails;
}> = ({
  values,
  initialBrandLanguage,
  customDomain,
  organizationSlug,
  websiteUrl,
  timeliBaseHost,
  timeliBaseUrl,
  customDomainARecordIp,
  billingSubscriptionDetails,
}) => {
  const t = useI18n("admin");
  const router = useRouter();

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    mode: "all",
    reValidateMode: "onChange",
    values,
  });

  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: SiteSettingsFormValues) => {
    try {
      setLoading(true);
      await toastPromise(
        (async () => {
          const result = await saveSiteSettingsAction(data);
          if (!result.ok) {
            throw new Error(result.code);
          }
          return result;
        })(),
        {
          success: t("settings.brand.form.toasts.changesSaved"),
          error: t("settings.brand.form.toasts.requestError"),
        },
      );
      if (data.brand.language !== initialBrandLanguage && window?.location) {
        setTimeout(() => window.location.reload(), 1000);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-6"
      >
        <Tabs defaultValue="general">
          <ResponsiveTabsList className="w-full flex flex-row gap-2">
            <TabsTrigger value="general">{t("navigation.general")}</TabsTrigger>
            <TabsTrigger value="brand">{t("navigation.brand")}</TabsTrigger>
            <TabsTrigger value="social">{t("navigation.social")}</TabsTrigger>
            <TabsTrigger value="styling">{t("navigation.styling")}</TabsTrigger>
          </ResponsiveTabsList>
          <TabsContent value="general">
            <div className="scroll-mt-24">
              <GeneralTab
                form={form}
                loading={loading}
                timeZoneValues={timeZoneValues}
                billingSubscriptionDetails={billingSubscriptionDetails}
              />
            </div>
          </TabsContent>

          <TabsContent value="brand">
            <div className="scroll-mt-24">
              <BrandTab
                form={form}
                loading={loading}
                customDomain={customDomain}
                organizationSlug={organizationSlug}
                websiteUrl={websiteUrl}
                timeliBaseHost={timeliBaseHost}
                timeliBaseUrl={timeliBaseUrl}
                customDomainARecordIp={customDomainARecordIp}
                canConnectCustomDomain={
                  billingSubscriptionDetails.planTier !== BillingPlanTier.Free
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="scroll-mt-24">
              <SocialTab form={form} loading={loading} />
            </div>
          </TabsContent>

          <TabsContent value="styling">
            <div className="scroll-mt-24">
              <StylingTab form={form} loading={loading} />
            </div>
          </TabsContent>
        </Tabs>

        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
