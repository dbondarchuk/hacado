import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { normalizeCustomerAuthConfiguration } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";
import { CustomerAccessSettingsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return { title: t("settings.customerAccess.title") };
}

export default async function Page() {
  const t = await getI18nAsync("admin");
  const servicesContainer = await getServicesContainer();
  const [customerAuth, smsEnabled, messagingAccess] = await Promise.all([
    servicesContainer.configurationService.getConfiguration("customerAuth"),
    servicesContainer.textMessageConfigurationService.isEnabled(),
    servicesContainer.textMessageConfigurationService.getSmsMessagingAccess(),
  ]);

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    {
      title: t("navigation.customerAccess"),
      link: "/dashboard/settings/customer-access",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title={t("settings.customerAccess.title")}
          description={t("settings.customerAccess.description")}
        />
        <CustomerAccessSettingsForm
          values={normalizeCustomerAuthConfiguration(customerAuth)}
          smsEnabled={smsEnabled}
          allowTextTemplates={messagingAccess.allowCustomTemplates}
          sharedPool={
            messagingAccess.platformBusiness && !messagingAccess.customVerified
          }
        />
      </div>
    </PageContainer>
  );
}
