import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getEnabledSocialAuthProviders } from "@/lib/auth/social-auth-providers";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import type { SessionUser } from "@hacado/types/users";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { canManageCalendarSources } from "@hacado/utils/permissions";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("users.profile.title"),
  };
}

export default async function Page() {
  const logger = getLoggerFactory("AdminPages")("users/me/profile");
  const t = await getI18nAsync("admin");
  const session = await getSession();

  logger.debug({ userId: session?.user.id }, "Loading profile page");
  if (!session) {
    redirect("/auth/signin");
  }

  const servicesContainer = await getServicesContainer();
  const [user, booking] = await Promise.all([
    servicesContainer.teamService.getMemberById(session.user.memberId),
    servicesContainer.configurationService.getConfiguration("booking"),
  ]);

  if (!user) {
    redirect("/auth/signin");
  }

  const canManageSources = canManageCalendarSources(
    session.user as SessionUser,
    {
      allowStaffCalendarSources: booking.allowStaffCalendarSources,
    },
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.profile"),
      mobileTitle: t("users.profile.title"),
      link: "/dashboard/users/me/profile",
    },
  ];

  const enabledSocialProviders = getEnabledSocialAuthProviders();

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader text={t("users.profile.description")} />
        <ProfileForm
          values={user}
          canManageCalendarSources={canManageSources}
          enabledSocialProviders={enabledSocialProviders}
        />
      </div>
    </PageContainer>
  );
}
