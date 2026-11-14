import { getServicesContainer, getSession } from "@/app/utils";
import { AppointmentsTable } from "@/components/admin/appointments/table/table";
import { AppointmentsTableAction } from "@/components/admin/appointments/table/table-action";
import { CommunicationLogsTableAction } from "@/components/admin/communication-logs/table/table-action";
import {
  CustomerForm,
  CustomerIdentityHeader,
} from "@/components/admin/customers/form";
import { CustomerSmsConsent } from "@/components/admin/customers/sms-consent";
import PageContainer from "@/components/admin/layout/page-container";
import { PaymentsTable } from "@/components/admin/payments/table/table";
import { PaymentsTableAction } from "@/components/admin/payments/table/table-action";
import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import {
  appointmentsSearchParamsCache,
  serializeAppointmentsSearchParams,
} from "@hacado/api-sdk/admin/search-params/appointments";
import {
  assetsSearchParamsCache,
  serializeAssetsSearchParams,
} from "@hacado/api-sdk/admin/search-params/assets";
import {
  communicationLogsSearchParamsCache,
  serializeCommunicationLogsSearchParams,
} from "@hacado/api-sdk/admin/search-params/communication-logs";
import {
  paymentsSearchParamsCache,
  paymentsSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/payments";
import { CustomerTabInjectorApps } from "@hacado/app-store/injectors/customer-tab";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  RecentCommunications,
  SendCommunicationButton,
} from "@hacado/ui-admin-kit/communications";
import {
  DataTableSkeleton,
  TableToolbarActionLabel,
} from "@hacado/ui-admin/data-table";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
import {
  ResponsiveTabsList,
  TabsContent,
  TabsTrigger,
  TabsViaUrl,
} from "@hacado/ui/tabs";
import { hasPermission } from "@hacado/utils/permissions";
import { CalendarClock } from "lucide-react";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache, Suspense } from "react";
import { AddPayment } from "./add-payment";
import {
  CustomerFiles,
  CustomerFilesTableAction,
  CustomerFileUpload,
} from "./files";
import { CustomerPackagesList } from "./packages";

type Props = PageProps<"/dashboard/customers/[id]/[tab]">;

const detailsTab = "details";
const appointmentsTab = "appointments";
const paymentsTab = "payments";
const filesTab = "files";
const communicationsTab = "communications";

const packagesTab = "packages";
const staticTabs = [
  detailsTab,
  appointmentsTab,
  paymentsTab,
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
  const canUsePayments = sessionCanUseFeature(session, "payments");
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
    (tab) =>
      (tab !== packagesTab || canUsePackages) &&
      (tab !== paymentsTab || canUsePayments),
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

  if (activeTab === paymentsTab && !canUsePayments) {
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
  } else if (activeTab === paymentsTab) {
    const parsed = paymentsSearchParamsCache.parse(searchParams);
    key = paymentsSearchParamsSerializer({ ...parsed });
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
    [paymentsTab]: t("customers.payments"),
    [packagesTab]: t("catalog.packages.customer.title"),
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
      title: t("customers.manageCustomer"),
      link: `/dashboard/customers/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable={scrollableTabs.includes(activeTab)}>
      <div className="flex min-w-0 w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <TabsViaUrl
          value={activeTab}
          usePath={path}
          className="flex min-w-0 flex-1 flex-col gap-4 tabs-url"
        >
          <PageHeader
            innerClassName="max-md:flex-col max-md:gap-0"
            titleClassName="max-md:w-full max-md:max-w-full"
            actionsClassName="max-md:w-full max-md:max-w-full"
            text={
              <div className="my-2 w-full min-w-0">
                <CustomerIdentityHeader customer={customer} />
              </div>
            }
            actions={
              <ResponsiveTabsList
                variant="line"
                className="min-w-0 border-b-0 py-2"
              >
                {allTabValues.map((tabValue) => (
                  <TabsTrigger value={tabValue} key={tabValue}>
                    {getTabLabel(tabValue)}
                  </TabsTrigger>
                ))}
              </ResponsiveTabsList>
            }
          />
          <TabsContent value={detailsTab} className="mt-0">
            {activeTab === detailsTab && (
              <CustomerForm
                initialData={customer}
                smsConsent={
                  <CustomerSmsConsent
                    customerId={customer._id}
                    hasPhone={Boolean(customer.phone)}
                    canUpdate={canUpdateCustomer}
                    isDeleted={customer.isDeleted}
                    status={
                      customer.phone
                        ? await servicesContainer.smsConsentService.getCustomerSmsConsentStatus(
                            customer.phone,
                          )
                        : { consented: false, optedOut: false }
                    }
                  />
                }
              />
            )}
          </TabsContent>
          {activeTab === appointmentsTab && (
            <TabsContent
              value={appointmentsTab}
              className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col gap-4"
            >
              <AppointmentsTableAction
                className="min-w-0 shrink-0"
                actions={
                  !customer.isDeleted ? (
                    <Link
                      button
                      href={`/dashboard/appointments/new?customer=${params.id}`}
                      size="sm"
                      variant="default"
                      aria-label={t("customers.scheduleAppointment")}
                    >
                      <CalendarClock className="h-4 w-4" />
                      <TableToolbarActionLabel>
                        {t("customers.scheduleAppointment")}
                      </TableToolbarActionLabel>
                    </Link>
                  ) : null
                }
              />
              <Suspense
                key={key}
                fallback={<DataTableSkeleton columnCount={9} rowCount={10} />}
              >
                <AppointmentsTable customerId={params.id} />
              </Suspense>
            </TabsContent>
          )}
          {activeTab === paymentsTab && canUsePayments && (
            <TabsContent
              value={paymentsTab}
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
            >
              <PaymentsTableAction
                className="min-w-0 shrink-0"
                showCustomerFilter={false}
                customerIdLock={params.id}
                actions={
                  !customer.isDeleted ? (
                    <AddPayment customerId={params.id} />
                  ) : null
                }
              />
              <Suspense
                key={key}
                fallback={<DataTableSkeleton columnCount={10} rowCount={10} />}
              >
                <PaymentsTable customerId={params.id} />
              </Suspense>
            </TabsContent>
          )}
          {activeTab === packagesTab && canUsePackages && (
            <TabsContent
              value={packagesTab}
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
            >
              <CustomerPackagesList customerId={params.id} />
            </TabsContent>
          )}
          {activeTab === filesTab && (
            <TabsContent
              value={filesTab}
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
            >
              <CustomerFilesTableAction
                actions={
                  !customer.isDeleted && canUpdateCustomer ? (
                    <CustomerFileUpload customerId={params.id} />
                  ) : null
                }
              />
              <Suspense
                key={key}
                fallback={<DataTableSkeleton columnCount={10} rowCount={10} />}
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
              className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
            >
              <CommunicationLogsTableAction
                className="min-w-0 shrink-0"
                actions={
                  !customer.isDeleted ? (
                    <SendCommunicationButton customerId={params.id} />
                  ) : null
                }
              />
              <Suspense
                key={key}
                fallback={<DataTableSkeleton columnCount={10} rowCount={10} />}
              >
                <RecentCommunications
                  customerId={params.id}
                  direction={communicationLogsSearchParamsCache.get(
                    "direction",
                  )}
                  channel={communicationLogsSearchParamsCache.get("channel")}
                  status={communicationLogsSearchParamsCache.get("status")}
                  start={communicationLogsSearchParamsCache.get("start")}
                  end={communicationLogsSearchParamsCache.get("end")}
                  search={communicationLogsSearchParamsCache.get("search")}
                  member={communicationLogsSearchParamsCache.get("member")}
                />
              </Suspense>
            </TabsContent>
          )}
          {customerTabItems
            .filter((item) => activeTab === item.href)
            .map((item) => (
              <TabsContent
                key={item.href}
                value={item.href}
                className="mt-0 flex min-h-0 flex-1 flex-col gap-4"
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
    </PageContainer>
  );
}
