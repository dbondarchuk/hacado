import { getServicesContainer } from "@/app/utils";
import {
  serviceOptionsSearchParams,
  serviceOptionsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const OptionsTable: React.FC = async () => {
  const page = serviceOptionsSearchParamsCache.get("page");
  const search = serviceOptionsSearchParamsCache.get("search") || undefined;
  const limit = serviceOptionsSearchParamsCache.get("limit");
  const sort = serviceOptionsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.servicesService.getOptions({
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
      sortSchemaDefault={serviceOptionsSearchParams.sort.defaultValue}
    />
  );
};
