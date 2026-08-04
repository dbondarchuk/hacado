import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import type { SessionUser } from "@timelish/types";
import { Breadcrumbs, Heading } from "@timelish/ui";
import { canManageCalendarSources } from "@timelish/utils";
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
      link: "/dashboard/users/me/profile",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("users.profile.title")}
            description={t("users.profile.description")}
          />
        </div>
        <ProfileForm
          values={user}
          canManageCalendarSources={canManageSources}
        />
      </div>
    </PageContainer>
  );
}
