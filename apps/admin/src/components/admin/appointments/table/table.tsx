import { getServicesContainer, getUser } from "@/app/utils";
import {
  appointmentsSearchParams,
  appointmentsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { gateMemberIds } from "@hacado/utils";
import { columns } from "./columns";

export const AppointmentsTable: React.FC<{ customerId?: string }> = async ({
  customerId,
}) => {
  const page = appointmentsSearchParamsCache.get("page");
  const search = appointmentsSearchParamsCache.get("search") || undefined;
  const limit = appointmentsSearchParamsCache.get("limit");
  const status = appointmentsSearchParamsCache.get("status");
  const start = appointmentsSearchParamsCache.get("start") || undefined;
  const end = appointmentsSearchParamsCache.get("end") || undefined;
  const sort = appointmentsSearchParamsCache.get("sort");

  const customerIds = appointmentsSearchParamsCache.get("customer");
  const discountIds = appointmentsSearchParamsCache.get("discount");
  const packageIds = appointmentsSearchParamsCache.get("package");
  const customerPackageId =
    appointmentsSearchParamsCache.get("customerPackageId") || undefined;
  const user = await getUser();
  const memberIds = gateMemberIds(
    user,
    appointmentsSearchParamsCache.get("member") ?? undefined,
  );

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.bookingService.getAppointments({
    range: { start, end },
    status,
    offset,
    limit,
    search,
    sort,
    customerId: customerId ?? customerIds ?? undefined,
    discountId: discountIds ?? undefined,
    memberId: memberIds ?? undefined,
    packageId: packageIds ?? undefined,
    customerPackageId,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={appointmentsSearchParams.sort.defaultValue}
    />
  );
};
