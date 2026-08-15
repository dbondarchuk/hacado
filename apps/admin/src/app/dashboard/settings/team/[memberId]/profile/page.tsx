import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { TeamMemberProfileForm } from "@/components/admin/team/team-member-profile-form";
import { getI18nAsync } from "@hacado/i18n/server";
import type { SessionUser } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { canUpdateTeamMemberProfile } from "@hacado/utils";
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

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings/brand" },
    { title: t("team.title"), link: "/dashboard/settings/team" },
    {
      title: t("team.editProfile.title"),
      link: `/dashboard/settings/team/${memberId}/profile`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("team.editProfile.title")}
            description={t("team.editProfile.description", {
              name: member.name || member.email,
            })}
          />
        </div>
        <TeamMemberProfileForm memberId={member._id} values={member} />
      </div>
    </PageContainer>
  );
}
