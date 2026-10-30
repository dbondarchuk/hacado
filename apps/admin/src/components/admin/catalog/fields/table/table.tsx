import { getServicesContainer } from "@/app/utils";
import { fieldsSearchParams, fieldsSearchParamsCache } from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin/data-table";
import { columns } from "./columns";

export const FieldsTable: React.FC = async () => {
  const page = fieldsSearchParamsCache.get("page");
  const search = fieldsSearchParamsCache.get("search") || undefined;
  const limit = fieldsSearchParamsCache.get("limit");
  const type = fieldsSearchParamsCache.get("type");
  const sort = fieldsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.catalogService.getFields(
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
      sortSchemaDefault={fieldsSearchParams.sort.defaultValue}
    />
  );
};
