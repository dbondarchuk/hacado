import { getServicesContainer } from "@/app/utils";
import { AppointmentsTable } from "@/components/admin/appointments/table/table";
import { AppointmentsTableAction } from "@/components/admin/appointments/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  appointmentsSearchParamsCache,
  serializeAppointmentsSearchParams,
} from "@hacado/api-sdk/admin/search-params/appointments";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  DataTableSkeleton,
  TableToolbarActionLabel,
} from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
import { CalendarClock } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/appointments">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("navigation.appointments"),
  };
}

export default async function AppointmentsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("appointments");
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = appointmentsSearchParamsCache.parse(searchParams);
  const key = serializeAppointmentsSearchParams({ ...parsed });

  let soldPackageFilterName: string | null = null;
  if (parsed.customerPackageId) {
    const servicesContainer = await getServicesContainer();
    const soldPackage =
      await servicesContainer.packagesService.getCustomerPackage(
        parsed.customerPackageId,
      );

    soldPackageFilterName = soldPackage?.name ?? null;
  }

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.appointments"),
      link: "/dashboard/appointments",
    },
  ];

  logger.debug(
    {
      searchParams: parsed,
      key,
    },
    "Loading appointments page",
  );

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <AppointmentsTableAction
          showCustomerFilter
          soldPackageFilterName={soldPackageFilterName}
          actions={
            <Link
              button
              href="/dashboard/appointments/new"
              size="sm"
              variant="default"
              aria-label={t("appointments.scheduleAppointment")}
            >
              <CalendarClock />
              <TableToolbarActionLabel>
                {t("appointments.scheduleAppointment")}
              </TableToolbarActionLabel>
            </Link>
          }
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={9} rowCount={10} />}
        >
          <AppointmentsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
