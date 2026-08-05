import { getServicesContainer } from "@/app/utils";
import {
  paymentsSearchParams,
  paymentsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const PaymentsTable: React.FC = async () => {
  const page = paymentsSearchParamsCache.get("page");
  const limit = paymentsSearchParamsCache.get("limit");
  const sort = paymentsSearchParamsCache.get("sort");
  const search = paymentsSearchParamsCache.get("search") || undefined;
  const start = paymentsSearchParamsCache.get("start") || undefined;
  const end = paymentsSearchParamsCache.get("end") || undefined;
  const customerIds = paymentsSearchParamsCache.get("customerId") || undefined;
  const appointmentIds =
    paymentsSearchParamsCache.get("appointmentId") || undefined;
  const type = paymentsSearchParamsCache.get("type") || undefined;
  const method = paymentsSearchParamsCache.get("method") || undefined;

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.paymentsService.list({
    offset,
    limit,
    sort,
    search,
    range: { start, end },
    customerId: customerIds?.[0],
    appointmentId: appointmentIds?.[0],
    type,
    method,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={paymentsSearchParams.sort.defaultValue}
    />
  );
};
