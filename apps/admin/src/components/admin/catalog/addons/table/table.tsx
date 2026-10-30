import { getServicesContainer } from "@/app/utils";
import {
  addonsSearchParams,
  addonsSearchParamsCache,
} from "@hacado/api-sdk/admin/search-params/addons";
import { DataTable } from "@hacado/ui-admin/data-table";
import { columns } from "./columns";

export const AddonsTable: React.FC = async () => {
  const page = addonsSearchParamsCache.get("page");
  const search = addonsSearchParamsCache.get("search") || undefined;
  const limit = addonsSearchParamsCache.get("limit");
  const sort = addonsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.catalogService.getAddons(
    {
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
      sortSchemaDefault={addonsSearchParams.sort.defaultValue}
    />
  );
};
