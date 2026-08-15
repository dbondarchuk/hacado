import PageContainer from "@/components/admin/layout/page-container";
import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import { DashboardTabInjectorApps } from "@hacado/app-store/injectors/dashboard-tab";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  Breadcrumbs,
  ResponsiveTabsList,
  Skeleton,
  TabsContent,
  TabsTrigger,
  TabsViaUrl,
} from "@hacado/ui";
import {
  canSeeAllCalendarMembers,
  canUpdateAppointments,
  canViewFinancials,
  resolveCalendarMemberId,
} from "@hacado/utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOrganizationId, getServicesContainer, getSession } from "../utils";
import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardKpiStrip } from "./dashboard-kpi-strip";
import { DashboardMemberFilter } from "./dashboard-member-filter";
import { getDashboardStats } from "./dashboard-stats";
import { EventsCalendar } from "./events-calendar";
import { NextAppointmentsCards } from "./next-appointments-cards";
import { DashboardNotificationsBadge } from "./notifications-toast-stream";
import { PendingAppointmentsTab } from "./pending-appointments-tab";

type Params = {
  searchParams: Promise<{
    activeTab?: string;
    key?: string;
    member?: string;
  }>;
};

const defaultTab = "overview";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("navigation.dashboard"),
  };
}

async function DashboardKpiSection({ memberId }: { memberId?: string }) {
  const [organizationId, session] = await Promise.all([
    getOrganizationId(),
    getSession(),
  ]);
  const stats = await getDashboardStats(organizationId, memberId);
  const showFinancials =
    sessionCanUseFeature(session, "financials") &&
    canViewFinancials(session?.user);
  return <DashboardKpiStrip stats={stats} showFinancials={showFinancials} />;
}

export default async function Page(params: Params) {
  const servicesContainer = await getServicesContainer();

  const logger = getLoggerFactory("AdminPages")("dashboard");
  const searchParams = await params.searchParams;
  const { activeTab = defaultTab, key, member } = searchParams;
  const tAdmin = await getI18nAsync("admin");
  const t = await getI18nAsync();
  const session = await getSession();
  const showFinancialKpis =
    sessionCanUseFeature(session, "financials") &&
    canViewFinancials(session?.user);
  const showMemberFilter = canSeeAllCalendarMembers(session?.user);
  const showPendingAppointmentsTab = canUpdateAppointments(session?.user);
  const memberId = resolveCalendarMemberId(
    session?.user,
    showMemberFilter ? member : undefined,
  );
  const memberScopeKey = memberId ?? "all";
  const breadcrumbItems = [
    { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
  ];

  if (activeTab === "appointments" && !showPendingAppointmentsTab) {
    redirect("/dashboard");
  }

  logger.debug(
    {
      activeTab,
      key,
      memberId,
    },
    "Loading dashboard page",
  );

  const dashboardTabApps =
    await servicesContainer.connectedAppsService.getAppsByScope(
      "dashboard-tab",
    );

  const dashboardTabAppsMap = dashboardTabApps
    .flatMap(
      (app) =>
        DashboardTabInjectorApps[app.name]?.items?.map((item) => ({
          ...item,
          appId: app._id,
          props: servicesContainer.connectedAppsService.getAppServiceProps(
            app._id,
          ),
          label: t(item.label),
          subtitle: t(item.subtitleKey),
        })) || [],
    )
    .sort((a, b) => b.order - a.order);

  const activeAppTab = dashboardTabAppsMap.find(
    (item) => item.href === activeTab,
  );

  const greetingSubtitle =
    activeTab === "appointments"
      ? tAdmin("dashboard.greeting.subtitlePending")
      : activeAppTab
        ? activeAppTab.subtitle
        : tAdmin("dashboard.greeting.subtitleOverview");

  return (
    <PageContainer scrollable>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="space-y-6 flex-1 pb-8">
        <DashboardGreeting subtitle={greetingSubtitle} />
        <Suspense>
          <TabsViaUrl defaultValue={defaultTab} className="space-y-5">
            <ResponsiveTabsList className="w-full flex flex-row gap-2">
              <TabsTrigger value="overview" className="rounded-full">
                {tAdmin("dashboard.tabs.overview")}
              </TabsTrigger>
              {showPendingAppointmentsTab ? (
                <TabsTrigger value="appointments" className="rounded-full">
                  {tAdmin("dashboard.tabs.pendingAppointments")}{" "}
                  <DashboardNotificationsBadge
                    notificationsCountKey="pending_appointments"
                    className="ml-1 scale-75 -translate-y-1"
                  />
                </TabsTrigger>
              ) : null}
              {dashboardTabAppsMap.map((item) => (
                <TabsTrigger
                  value={item.href}
                  key={item.href}
                  className="rounded-full"
                >
                  {item.label}{" "}
                  {item.notificationsCountKey ? (
                    <DashboardNotificationsBadge
                      notificationsCountKey={item.notificationsCountKey}
                      className="ml-1 scale-75 -translate-y-1"
                    />
                  ) : null}
                </TabsTrigger>
              ))}
            </ResponsiveTabsList>
            {activeTab === "overview" && (
              <TabsContent
                value="overview"
                className="space-y-5 @container [contain:layout]"
              >
                {showMemberFilter ? <DashboardMemberFilter /> : null}
                <Suspense
                  key={`kpi-${memberScopeKey}`}
                  fallback={
                    <div
                      className={
                        showFinancialKpis
                          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                          : "grid grid-cols-1 gap-3 sm:grid-cols-2"
                      }
                    >
                      {Array.from({
                        length: showFinancialKpis ? 4 : 2,
                      }).map((_, index) => (
                        <Skeleton
                          className="h-24 w-full rounded-2xl"
                          key={index}
                        />
                      ))}
                    </div>
                  }
                >
                  <DashboardKpiSection memberId={memberId} />
                </Suspense>
                <div className="flex flex-col-reverse @6xl:flex-row gap-6">
                  <div className="flex flex-col @6xl:flex-1 min-w-0">
                    <EventsCalendar memberId={memberId} />
                  </div>
                  <div className="@6xl:w-80 @6xl:shrink-0 flex flex-col gap-2">
                    <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
                      {tAdmin("dashboard.appointments.nextAppointments")}
                    </h2>
                    <Suspense
                      key={`next-${memberScopeKey}-${key ?? ""}`}
                      fallback={
                        <>
                          {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton className="w-full h-40" key={index} />
                          ))}
                        </>
                      }
                    >
                      <NextAppointmentsCards
                        className="flex-row @6xl:flex-col flex-wrap gap-2"
                        memberId={memberId}
                      />
                    </Suspense>
                  </div>
                </div>
              </TabsContent>
            )}
            {activeTab === "appointments" && showPendingAppointmentsTab && (
              <TabsContent value="appointments" className="space-y-4 flex-1">
                <Suspense
                  key={key}
                  fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton className="w-full h-72" key={index} />
                      ))}
                    </div>
                  }
                >
                  <PendingAppointmentsTab />
                </Suspense>
              </TabsContent>
            )}
            {dashboardTabAppsMap
              .filter((item) => item.href === activeTab)
              .map((item) => (
                <TabsContent
                  value={item.href}
                  className="space-y-4 flex-1"
                  key={item.href}
                >
                  <Suspense
                    key={key}
                    fallback={<Skeleton className="w-full h-72" />}
                  >
                    <item.view
                      appId={item.appId}
                      props={item.props}
                      searchParams={searchParams}
                    />
                  </Suspense>
                </TabsContent>
              ))}
          </TabsViaUrl>
        </Suspense>
      </div>
    </PageContainer>
  );
}
