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
} from "@hacado/api-sdk/admin/search-params/teams";
import { getI18nAsync } from "@hacado/i18n/server";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Button } from "@hacado/ui/button";
import { canManageTeam } from "@hacado/utils/permissions";
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
  const feesExempt = org?.feesExempt === true;
  const availableUsers = org?.availableUsers ?? 1;
  const activeMemberCount = await services.teamService.getActiveMemberCount();
  const allowAdditionalUsers =
    feesExempt || (org?.allowAdditionalUsers ?? false);

  const atCapacity = !feesExempt && activeMemberCount >= availableUsers;

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    {
      title: t("team.title"),
      mobileTitle: t("team.title"),
      link: "/dashboard/settings/team",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <SeatsPurchaseSuccessToast />
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />

        {atCapacity ? (
          <TeamSeatsCapacityHint allowAdditionalUsers={allowAdditionalUsers} />
        ) : null}

        <PendingInvitations />

        <TeamMembersTableAction
          actions={
            !atCapacity && allowAdditionalUsers ? (
              <InviteMemberButton
                atCapacity={false}
                allowAdditionalUsers={allowAdditionalUsers}
              />
            ) : !allowAdditionalUsers ? (
              <Button type="button" variant="primary" asChild size="sm">
                <Link href={BRAND_SETTINGS_UPGRADE_URL}>
                  {t("team.upgradeLink")}
                </Link>
              </Button>
            ) : atCapacity ? (
              <PurchaseSeatsDialog canPurchase triggerVariant="primary" />
            ) : null
          }
        />
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
        <p className="text-sm text-muted-foreground">
          {feesExempt
            ? t("team.seatsUnlimited", { active: activeMemberCount })
            : t("team.seats", {
                active: activeMemberCount,
                available: availableUsers,
              })}
        </p>
      </div>
    </PageContainer>
  );
}
