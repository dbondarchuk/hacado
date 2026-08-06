import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { InviteMemberButton } from "@/components/admin/team/invite-member-button";
import { PendingInvitations } from "@/components/admin/team/pending-invitations";
import { PurchaseSeatsDialog } from "@/components/admin/team/purchase-seats-dialog";
import { SeatsPurchaseSuccessToast } from "@/components/admin/team/seats-purchase-success-toast";
import { TeamMembersTableColumnLength } from "@/components/admin/team/table/columns";
import { TeamMembersTable } from "@/components/admin/team/table/table";
import { TeamMembersTableAction } from "@/components/admin/team/table/table-action";
import { TeamSeatsCapacityHint } from "@/components/admin/team/team-seats-capacity-hint";
import { BRAND_SETTINGS_UPGRADE_URL } from "@/lib/billing/subscription-plan-access";
import {
  teamsSearchParamsCache,
  teamsSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Button, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { canManageTeam } from "@hacado/utils";
import { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { Suspense } from "react";

type Params = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("team.title"),
  };
}

export default async function TeamSettingsPage(props: Params) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!canManageTeam(session.user)) {
    forbidden();
  }

  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = teamsSearchParamsCache.parse(searchParams);
  const key = teamsSearchParamsSerializer({ ...parsed });

  const services = await getServicesContainer();
  const org = await services.organizationService.getOrganization();
  const availableUsers = org?.availableUsers ?? 1;
  const activeMemberCount = await services.teamService.getActiveMemberCount();
  const allowAdditionalUsers = org?.allowAdditionalUsers ?? false;
  const atCapacity = activeMemberCount >= availableUsers;

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings/brand" },
    { title: t("team.title"), link: "/dashboard/settings/team" },
  ];

  return (
    <PageContainer scrollable={false}>
      <SeatsPurchaseSuccessToast />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Heading
                title={t("team.title")}
                description={t("team.description")}
              />
              <p className="text-sm text-muted-foreground">
                {t("team.seats", {
                  active: activeMemberCount,
                  available: availableUsers,
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {atCapacity && allowAdditionalUsers ? (
                <PurchaseSeatsDialog canPurchase triggerVariant="primary" />
              ) : null}
              {atCapacity && !allowAdditionalUsers ? (
                <Button type="button" variant="primary" asChild>
                  <Link href={BRAND_SETTINGS_UPGRADE_URL}>
                    {t("team.upgradeLink")}
                  </Link>
                </Button>
              ) : null}
              {!atCapacity ? (
                <InviteMemberButton
                  atCapacity={false}
                  allowAdditionalUsers={allowAdditionalUsers}
                />
              ) : null}
            </div>
          </div>
        </div>

        {atCapacity ? (
          <TeamSeatsCapacityHint allowAdditionalUsers={allowAdditionalUsers} />
        ) : null}

        <PendingInvitations />

        <TeamMembersTableAction />
        <Suspense
          key={key}
          fallback={
            <DataTableSkeleton
              columnCount={TeamMembersTableColumnLength}
              rowCount={10}
            />
          }
        >
          <TeamMembersTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
