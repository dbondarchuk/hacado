import { findPendingInvitationForEmail } from "@/app/accept-invitation/actions";
import Header from "@/components/admin/layout/header";
import { AppSidebar } from "@/components/admin/layout/sidebar";
import { SubscriptionInactiveBillingPortalButton } from "@/components/subscription-inactive-billing-portal-button";
import { navItems } from "@/constants/data";
import { filterNavItemsForPermission } from "@/lib/auth/filter-nav-items-for-role";
import { organizationHasInstallBillingAccess } from "@/lib/billing/install-billing-access";
import {
  isSubscriptionInactive,
  isSubscriptionPastDue,
} from "@/lib/billing/subscription-access";
import {
  filterNavItemsForPlanTier,
  getAppMinimumPlanTier,
  getSessionPlanTier,
  isFreeTier,
} from "@/lib/billing/subscription-plan-access";
import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { AppMenuItems } from "@hacado/app-store/menu-items";
import { getI18nAsync } from "@hacado/i18n/server";
import { NavItemGroup } from "@hacado/types";
import {
  BreadcrumbsProvider,
  cn,
  ConfigProvider,
  Link,
  SidebarInset,
  SidebarProvider,
} from "@hacado/ui";
import { canFilterByMember } from "@hacado/utils";
import { AlertTriangle, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { CookiesProvider } from "../../components/cookies-provider";
import {
  getOrganizationIdAndSlug,
  getServicesContainer,
  getSession,
  getWebsiteUrl,
} from "../utils";
import { NotificationsToastStream } from "./notifications-toast-stream";
import { SubscriptionStatusListener } from "./subscription-status-listener";

const SIDEBAR_COOKIE_NAME = "admin-sidebar-open";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  if (!session.user.organizationId || !session.user.organizationInstalled) {
    if (!session.user.organizationId) {
      const pendingInvitation = await findPendingInvitationForEmail(
        session.user.email,
      );
      if (pendingInvitation) {
        redirect(
          `/accept-invitation?invitationId=${encodeURIComponent(pendingInvitation.id)}`,
        );
      }
    }
    const billingOk = await organizationHasInstallBillingAccess(
      session.user.organizationId,
    );
    if (!billingOk) {
      redirect("/checkout");
    }
    redirect("/install");
  }

  const subscriptionStatus = session.user.subscriptionStatus;
  const planTier = getSessionPlanTier(session);
  const showFreeTierUpgradeBanner =
    isFreeTier(planTier) && !isSubscriptionPastDue(subscriptionStatus);
  const t = await getI18nAsync("admin");

  const servicesContainer = await getServicesContainer();

  const cookieStore = await cookies();
  const sidebarDefaultOpen =
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true";

  const { general, brand } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
    );

  const name = general.name;
  const logo = brand.logo;

  const websiteUrl = await getWebsiteUrl();
  const { organizationDomain } = await getOrganizationIdAndSlug();

  let groups: NavItemGroup[] = navItems.map((x) => ({
    ...x,
    children: [
      ...x.children.map((y) => ({
        ...y,
        items: y.items ? [...y.items] : [],
      })),
    ],
  }));

  const appsWithMenu = await servicesContainer.connectedAppsService.getApps();
  const appsMenus = appsWithMenu.flatMap(({ name }) =>
    (AppMenuItems[name] || []).map((item) => ({
      ...item,
      minimumPlanTier: item.minimumPlanTier ?? getAppMinimumPlanTier(name),
    })),
  );

  appsMenus
    .filter((item) => !item.parent && !item.isHidden)
    .sort(({ order: aOrder = 0 }, { order: bOrder = 0 }) => bOrder - aOrder)
    .filter((item) => !!item.group)
    .forEach(({ Page: _, ...item }) => {
      const group = groups.find((group) => group.id === item.group);
      if (!group) return;
      group.children = group.children || [];
      group.children.push({
        ...item,
        href: `/dashboard/${item.href}`,
        title: item.label,
      });
    });

  const menuItems = groups.flatMap((group) => group.children);
  appsMenus
    .filter((item) => !!item.parent && !item.isHidden)
    .sort(({ order: aOrder = 0 }, { order: bOrder = 0 }) => bOrder - aOrder)
    .forEach(({ Page: _, ...item }) => {
      const parent = menuItems.find((parent) => item.parent === parent.id);
      if (!parent) return;

      if (!parent.items?.length) {
        parent.items = [];
        if (!parent.removeIfBecameParent) {
          parent.items.push({
            id: parent.id,
            title: parent.title,
            href: parent.href,
            disabled: parent.disabled,
            external: parent.external,
            icon: parent.icon,
            label: parent.label,
            description: parent.description,
            notificationsCountKey: parent.notificationsCountKey,
            minimumPlanTier: parent.minimumPlanTier,
            requiredPermission: parent.requiredPermission,
          });
        }
      }

      parent.items.push({
        ...item,
        href: `/dashboard/${item.href}`,
        title: item.label,
      });
    });

  groups = filterNavItemsForPlanTier(groups, planTier);
  groups = filterNavItemsForPermission(groups, session.user);
  const isSubscriptionPastDueFlag = isSubscriptionPastDue(subscriptionStatus);

  const canSeeInactiveMemberWarnings = canFilterByMember(session.user);
  const inactiveMemberWarnings = canSeeInactiveMemberWarnings
    ? await servicesContainer.teamService.hasUpcomingAppointmentsOnInactiveMembers()
    : [];
  const inactiveMemberAppointmentCount = inactiveMemberWarnings.reduce(
    (sum, warning) => sum + warning.count,
    0,
  );
  const inactiveMembersAppointmentsHref = `/dashboard/appointments${serializeAppointmentsSearchParams(
    { member: inactiveMemberWarnings.map((warning) => warning.memberId) },
  )}`;

  return (
    <div className="flex">
      <ConfigProvider
        generalConfiguration={general}
        brandConfiguration={brand}
        domain={organizationDomain}
        websiteUrl={websiteUrl}
      >
        <SidebarProvider
          defaultOpen={sidebarDefaultOpen}
          cookieName={SIDEBAR_COOKIE_NAME}
        >
          <BreadcrumbsProvider>
            <CookiesProvider>
              <NuqsAdapter>
                {isSubscriptionInactive(subscriptionStatus) ? (
                  <div className="flex-1 p-6">
                    <div className="mx-auto mt-10 max-w-2xl rounded-lg border p-8 text-center">
                      <h2 className="text-2xl font-semibold">
                        {t("dashboard.subscriptionInactive.title")}
                      </h2>
                      <p className="mt-3 text-muted-foreground">
                        {t("dashboard.subscriptionInactive.description")}
                      </p>
                      <div className="mt-6 flex justify-center">
                        <SubscriptionInactiveBillingPortalButton />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <AppSidebar
                      menuItems={groups}
                      name={name}
                      domain={organizationDomain}
                      logo={logo}
                    />
                    <NotificationsToastStream />
                    <SubscriptionStatusListener />
                    <SidebarInset
                      className={cn(
                        "group/main",
                        isSubscriptionPastDueFlag ||
                          showFreeTierUpgradeBanner ||
                          inactiveMemberAppointmentCount > 0
                          ? "has-banner"
                          : "",
                      )}
                    >
                      {/* <main className="w-full flex-1 overflow-hidden"> */}
                      <Header />
                      {isSubscriptionPastDueFlag ? (
                        <div
                          className="mx-4 mt-4 flex overflow-hidden rounded-lg border border-amber-500/50 bg-amber-950 shadow-sm dark:border-amber-500/40"
                          role="alert"
                        >
                          <div
                            className="w-1.5 shrink-0 bg-amber-400"
                            aria-hidden
                          />
                          <div className="flex flex-1 flex-col items-stretch justify-center gap-3 p-3 pl-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-4">
                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                              <AlertTriangle
                                className="mt-0.5 size-5 shrink-0 text-amber-400 sm:mt-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <p className="text-base font-medium leading-snug text-amber-100/95">
                                {t(
                                  "dashboard.subscriptionPastDueBanner.message",
                                )}
                              </p>
                            </div>
                            <Link
                              href="/dashboard/settings/brand?activeTab=general"
                              className="inline-flex shrink-0 items-center justify-center self-start rounded-full border-2 border-amber-400/80 bg-transparent px-4 py-2 text-base font-medium text-amber-200 hover:text-amber-200/90 transition-colors hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 sm:self-auto"
                            >
                              {t(
                                "dashboard.subscriptionPastDueBanner.goToSettings",
                              )}
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {showFreeTierUpgradeBanner ? (
                        <div
                          className="mx-4 mt-4 flex overflow-hidden rounded-lg border border-primary/35 bg-primary/5 shadow-sm dark:border-primary/30 dark:bg-primary/10"
                          role="status"
                        >
                          <div
                            className="w-1.5 shrink-0 bg-primary"
                            aria-hidden
                          />
                          <div className="flex flex-1 flex-col items-stretch justify-center gap-3 p-3 pl-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-4">
                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                              <Sparkles
                                className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <p className="text-base font-medium leading-snug text-foreground">
                                {t("dashboard.freeTierUpgradeBanner.message")}
                              </p>
                            </div>
                            <Link
                              href="/dashboard/settings/brand?activeTab=general"
                              className="inline-flex shrink-0 items-center justify-center self-start rounded-full border-2 border-primary/60 bg-transparent px-4 py-2 text-base font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:self-auto"
                            >
                              {t("dashboard.freeTierUpgradeBanner.upgrade")}
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {inactiveMemberAppointmentCount > 0 ? (
                        <div
                          className="mx-4 mt-4 flex overflow-hidden rounded-lg border border-amber-500/50 bg-amber-950 shadow-sm dark:border-amber-500/40"
                          role="alert"
                        >
                          <div
                            className="w-1.5 shrink-0 bg-amber-400"
                            aria-hidden
                          />
                          <div className="flex flex-1 flex-col items-stretch justify-center gap-3 p-3 pl-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-4">
                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                              <AlertTriangle
                                className="mt-0.5 size-5 shrink-0 text-amber-400 sm:mt-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <p className="text-base font-medium leading-snug text-amber-100/95">
                                {t("dashboard.inactiveMembersBanner.message", {
                                  count: inactiveMemberAppointmentCount,
                                })}
                              </p>
                            </div>
                            <Link
                              href={inactiveMembersAppointmentsHref}
                              className="inline-flex shrink-0 items-center justify-center self-start rounded-full border-2 border-amber-400/80 bg-transparent px-4 py-2 text-base font-medium text-amber-200 hover:text-amber-200/90 transition-colors hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 sm:self-auto"
                            >
                              {t(
                                "dashboard.inactiveMembersBanner.viewAppointments",
                              )}
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {children}

                      {/* </main> */}
                    </SidebarInset>
                  </>
                )}
              </NuqsAdapter>
            </CookiesProvider>
          </BreadcrumbsProvider>
        </SidebarProvider>
      </ConfigProvider>
    </div>
  );
}
