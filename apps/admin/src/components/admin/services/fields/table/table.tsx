import { getServicesContainer } from "@/app/utils";
import {
  serviceFieldsSearchParams,
  serviceFieldsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const FieldsTable: React.FC = async () => {
  const page = serviceFieldsSearchParamsCache.get("page");
  const search = serviceFieldsSearchParamsCache.get("search") || undefined;
  const limit = serviceFieldsSearchParamsCache.get("limit");
  const type = serviceFieldsSearchParamsCache.get("type");
  const sort = serviceFieldsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.servicesService.getFields(
    {
      type,
      offset,
      limit,
      search,
      sort,
    },
    true,
  );

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={serviceFieldsSearchParams.sort.defaultValue}
    />
  );
};
