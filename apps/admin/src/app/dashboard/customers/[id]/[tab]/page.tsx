import { getServicesContainer, getSession } from "@/app/utils";
import { AppointmentsTable } from "@/components/admin/appointments/table/table";
import { AppointmentsTableAction } from "@/components/admin/appointments/table/table-action";
import { CommunicationLogsTableAction } from "@/components/admin/communication-logs/table/table-action";
import { CustomerForm } from "@/components/admin/customers/form";
import PageContainer from "@/components/admin/layout/page-container";
import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import {
  appointmentsSearchParamsCache,
  assetsSearchParamsCache,
  communicationLogsSearchParamsCache,
  serializeAppointmentsSearchParams,
  serializeAssetsSearchParams,
  serializeCommunicationLogsSearchParams,
} from "@hacado/api-sdk";
import { CustomerTabInjectorApps } from "@hacado/app-store/injectors/customer-tab";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  Breadcrumbs,
  Heading,
  Link,
  ResponsiveTabsList,
  TabsContent,
  TabsTrigger,
  TabsViaUrl,
} from "@hacado/ui";
import { CustomerName, DataTableSkeleton } from "@hacado/ui-admin";
import {
  HeaderActionButtonsContainer,
  HeaderActionButtonsPortal,
  HeaderActionButtonsProvider,
  RecentCommunications,
  SendCommunicationButton,
} from "@hacado/ui-admin-kit";
import { hasPermission } from "@hacado/utils";
import { CalendarClock } from "lucide-react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache, Suspense } from "react";
import {
  CustomerFiles,
  CustomerFilesTableAction,
  CustomerFileUpload,
} from "./files";
import { CustomerPackagesList } from "./packages";

type Props = PageProps<"/dashboard/customers/[id]/[tab]">;

const detailsTab = "details";
const appointmentsTab = "appointments";
const filesTab = "files";
const communicationsTab = "communications";

const packagesTab = "packages";
const staticTabs = [
  detailsTab,
  appointmentsTab,
  packagesTab,
  filesTab,
  communicationsTab,
] as const;

const baseScrollableTabs = [
  detailsTab,
  communicationsTab,
  filesTab,
  packagesTab,
];

type StaticTab = (typeof staticTabs)[number];

const getCustomer = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.customersService.getCustomer(id, {
    includeDeleted: true,
  });
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const customer = await getCustomer(id);
  return {
    title: `${customer?.name} | ${t("customers.title")}`,
  };
}

export default async function CustomerPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("customer-detail");
  const t = await getI18nAsync("admin");
  const tAll = await getI18nAsync();
  const [servicesContainer, session] = await Promise.all([
    getServicesContainer(),
    getSession(),
  ]);
  const canUpdateCustomer = hasPermission(session.user, "customer", "update");
  const canUsePackages = sessionCanUseFeature(session, "packages");
  const params = await props.params;
  const path = `/dashboard/customers/${params.id}`;

  const customerTabApps =
    await servicesContainer.connectedAppsService.getAppsByScope("customer-tab");

  const customerTabItems = customerTabApps.flatMap((app) =>
    (CustomerTabInjectorApps[app.name]?.items ?? []).map((item) => ({
      ...item,
      appId: app._id,
      props: servicesContainer.connectedAppsService.getAppServiceProps(app._id),
      label: tAll(item.label),
    })),
  );

  const dynamicTabHrefs = customerTabItems.map((item) => item.href);
  const dynamicTabScrollable = customerTabItems
    .filter((item) => item.scrollable)
    .map((item) => item.href);
  const visibleStaticTabs = staticTabs.filter(
    (tab) => tab !== packagesTab || canUsePackages,
  );
  const allTabValues = [...visibleStaticTabs, ...dynamicTabHrefs];
  const scrollableTabs = [
    ...baseScrollableTabs.filter(
      (tab) => tab !== packagesTab || canUsePackages,
    ),
    ...dynamicTabScrollable,
  ];
  const activeTab = params.tab as string;
  if (activeTab === packagesTab && !canUsePackages) {
    redirect(`/dashboard/customers/${params.id}/${detailsTab}`);
  }
  if (!allTabValues.includes(activeTab)) {
    logger.warn(
      {
        customerId: params.id,
        invalidTab: params.tab,
        validTabs: allTabValues,
      },
      "Invalid tab requested",
    );
    notFound();
  }

  const searchParams = await props.searchParams;

  let key: string = "";
  if (activeTab === appointmentsTab) {
    const parsed = appointmentsSearchParamsCache.parse(searchParams);
    key = serializeAppointmentsSearchParams({ ...parsed });
  } else if (activeTab === filesTab) {
    const parsed = assetsSearchParamsCache.parse(searchParams);
    key = serializeAssetsSearchParams({ ...parsed });
  } else if (activeTab === communicationsTab) {
    const parsed = communicationLogsSearchParamsCache.parse(searchParams);
    key = serializeCommunicationLogsSearchParams({ ...parsed });
  }

  if (searchParams.key) {
    key = searchParams.key as string;
  }

  logger.debug(
    {
      customerId: params.id,
      activeTab,
      key,
    },
    "Loading customer detail page",
  );

  const customer = await getCustomer(params.id);

  if (!customer) {
    logger.warn({ customerId: params.id }, "Customer not found");
    return notFound();
  }

  logger.debug(
    {
      customerId: params.id,
      customerName: customer.name,
      customerEmail: customer.email,
      activeTab,
    },
    "Customer detail page loaded",
  );

  const tabTitle: Record<StaticTab, string> = {
    [detailsTab]: t("customers.details"),
    [appointmentsTab]: t("customers.appointments"),
    [packagesTab]: t("services.packages.customer.title"),
    [filesTab]: t("customers.files"),
    [communicationsTab]: t("customers.communications"),
  };

  const getTabLabel = (tabValue: string) =>
    tabTitle[tabValue as StaticTab] ??
    customerTabItems.find((i) => i.href === tabValue)?.label ??
    tabValue;

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("customers.title"), link: "/dashboard/customers" },
    {
      title: customer.name,
      link: `/dashboard/customers/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable={scrollableTabs.includes(activeTab)}>
      <HeaderActionButtonsProvider>
        <div className="flex flex-1 flex-col gap-4 w-full">
          <div className="flex flex-row items-center gap-4 justify-between">
            <Breadcrumbs items={breadcrumbItems} />
            <Heading
              title={<CustomerName customer={customer} />}
              description={t("customers.manageCustomer")}
            />

            <HeaderActionButtonsContainer />
          </div>
          <div className="flex flex-col gap-4 flex-1">
            <TabsViaUrl
              value={activeTab}
              usePath={path}
              className="flex-1 flex flex-col gap-4 tabs-url"
            >
              <ResponsiveTabsList className="w-full flex flex-row gap-2">
                {allTabValues.map((tabValue) => (
                  <TabsTrigger value={tabValue} key={tabValue}>
                    {getTabLabel(tabValue)}
                  </TabsTrigger>
                ))}
              </ResponsiveTabsList>
              <TabsContent value={detailsTab}>
                {activeTab === detailsTab && (
                  <CustomerForm initialData={customer} />
                )}
              </TabsContent>
              {activeTab === appointmentsTab && (
                <TabsContent
                  value={appointmentsTab}
                  className="flex flex-1 flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <AppointmentsTableAction className="flex-1" />
                    {!customer.isDeleted && (
                      <HeaderActionButtonsPortal>
                        <Link
                          button
                          href={`/dashboard/appointments/new?customer=${params.id}`}
                          variant="default"
                          aria-label={t("customers.scheduleAppointment")}
                        >
                          <CalendarClock className="h-4 w-4" />
                          <span className="max-md:hidden">
                            {t("customers.scheduleAppointment")}
                          </span>
                        </Link>
                      </HeaderActionButtonsPortal>
                    )}
                  </div>
                  <Suspense
                    key={key}
                    fallback={
                      <DataTableSkeleton columnCount={9} rowCount={10} />
                    }
                  >
                    <AppointmentsTable customerId={params.id} />
                  </Suspense>
                </TabsContent>
              )}
              {activeTab === packagesTab && canUsePackages && (
                <TabsContent
                  value={packagesTab}
                  className="flex flex-1 flex-col gap-4"
                >
                  <CustomerPackagesList customerId={params.id} />
                </TabsContent>
              )}
              {activeTab === filesTab && (
                <TabsContent
                  value={filesTab}
                  className="flex flex-1 flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <CustomerFilesTableAction />
                    {!customer.isDeleted && canUpdateCustomer && (
                      <HeaderActionButtonsPortal>
                        <CustomerFileUpload customerId={params.id} />
                      </HeaderActionButtonsPortal>
                    )}
                  </div>
                  <Suspense
                    key={key}
                    fallback={
                      <DataTableSkeleton columnCount={10} rowCount={10} />
                    }
                  >
                    <CustomerFiles
                      customerId={params.id}
                      search={serializeAssetsSearchParams({
                        search: assetsSearchParamsCache.get("search"),
                      })}
                    />
                  </Suspense>
                </TabsContent>
              )}
              {activeTab === communicationsTab && (
                <TabsContent
                  value={communicationsTab}
                  className="flex flex-1 flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <CommunicationLogsTableAction className="flex-1" />
                    {!customer.isDeleted && (
                      <HeaderActionButtonsPortal>
                        <SendCommunicationButton customerId={params.id} />
                      </HeaderActionButtonsPortal>
                    )}
                  </div>
                  <Suspense
                    key={key}
                    fallback={
                      <DataTableSkeleton columnCount={10} rowCount={10} />
                    }
                  >
                    <RecentCommunications customerId={params.id} />
                  </Suspense>
                </TabsContent>
              )}
              {customerTabItems
                .filter((item) => activeTab === item.href)
                .map((item) => (
                  <TabsContent
                    key={item.href}
                    value={item.href}
                    className="flex flex-1 flex-col gap-4"
                  >
                    {item.view({
                      props: item.props,
                      appId: item.appId,
                      customer,
                      searchParams,
                    })}
                  </TabsContent>
                ))}
            </TabsViaUrl>
          </div>
        </div>
      </HeaderActionButtonsProvider>
    </PageContainer>
  );
}
