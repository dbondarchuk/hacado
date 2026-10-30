import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  requiresSmsVerification,
  SmsRegistrationStore,
} from "@hacado/services/text-message";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { TextMessagingSettingsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return { title: t("settings.textMessaging.title") };
}

export default async function Page() {
  const t = await getI18nAsync("admin");
  const session = await getSession();
  if (
    !meetsMinimumPlanTier(getSessionPlanTier(session), BillingPlanTier.Solo)
  ) {
    redirect("/dashboard");
  }

  const services = await getServicesContainer();
  const organizationId = await getOrganizationId();
  const [general, textMessaging, registration] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    services.configurationService.getConfiguration("textMessaging"),
    new SmsRegistrationStore().get(organizationId),
  ]);
  const verificationStatus = registration?.status;
  const verificationCopy =
    verificationStatus === "verified"
      ? {
          prompt: t("settings.textMessaging.verification.verifiedPrompt"),
          action: t("settings.textMessaging.verification.verifiedAction"),
        }
      : verificationStatus === "rejected"
        ? {
            prompt: t("settings.textMessaging.verification.failedPrompt"),
            action: t("settings.textMessaging.verification.failedAction"),
          }
        : verificationStatus === "pending"
          ? {
              prompt: t("settings.textMessaging.verification.pendingPrompt"),
              action: t("settings.textMessaging.verification.pendingAction"),
            }
          : {
              prompt: t("settings.textMessaging.verification.prompt"),
              action: t("settings.textMessaging.verification.action"),
            };

  const [privacyPage, termsPage] = await Promise.all([
    services.pagesService.getPageBySlug("privacy").catch(() => null),
    services.pagesService.getPageBySlug("terms").catch(() => null),
  ]);
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    {
      title: t("navigation.textMessaging"),
      link: "/dashboard/settings/text-messaging",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title={t("settings.textMessaging.title")}
          description={t("settings.textMessaging.description")}
        />
        <TextMessagingSettingsForm
          textMessaging={{
            enabled: textMessaging?.enabled === true,
            privacyPageId: textMessaging?.privacyPageId || privacyPage?._id,
            termsPageId: textMessaging?.termsPageId || termsPage?._id,
          }}
        />
        {requiresSmsVerification(general.country) ? (
          <section className="flex flex-col items-start gap-3 rounded-lg border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>{verificationCopy.prompt}</p>
            <Link
              button
              href="/dashboard/settings/text-messaging/verification"
              variant="default"
              size="sm"
            >
              {verificationCopy.action}
            </Link>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}
