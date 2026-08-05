import { getServicesContainer } from "@/app/utils";
import {
  customersSearchParams,
  customersSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const CustomersTable: React.FC = async () => {
  const page = customersSearchParamsCache.get("page");
  const search = customersSearchParamsCache.get("search") || undefined;
  const limit = customersSearchParamsCache.get("limit");
  const sort = customersSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.customersService.getCustomers({
    offset,
    limit,
    search,
    sort,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={customersSearchParams.sort.defaultValue}
    />
  );
};
