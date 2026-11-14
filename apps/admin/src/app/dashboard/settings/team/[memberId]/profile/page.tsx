import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { TeamMemberProfileForm } from "@/components/admin/team/team-member-profile-form";
import { getI18nAsync } from "@hacado/i18n/server";
import type { SessionUser } from "@hacado/types/users";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { canUpdateTeamMemberProfile } from "@hacado/utils/permissions";
import { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";

type Params = {
  params: Promise<{ memberId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("team.editProfile.title"),
  };
}

export default async function EditTeamMemberProfilePage(props: Params) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const { memberId } = await props.params;
  const services = await getServicesContainer();
  const member = await services.teamService.getMemberById(memberId);
  if (!member) {
    notFound();
  }

  if (
    !canUpdateTeamMemberProfile(session.user as SessionUser, {
      memberId: member._id,
      role: member.role,
    })
  ) {
    forbidden();
  }

  const t = await getI18nAsync("admin");
  const profileDescription = t("team.editProfile.description", {
    name: member.name || member.email,
  });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    { title: t("team.title"), link: "/dashboard/settings/team" },
    {
      title: t("team.editProfile.title"),
      mobileTitle: t("team.editProfile.title"),
      link: `/dashboard/settings/team/${memberId}/profile`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader text={profileDescription} />
        <TeamMemberProfileForm memberId={member._id} values={member} />
      </div>
    </PageContainer>
  );
}
