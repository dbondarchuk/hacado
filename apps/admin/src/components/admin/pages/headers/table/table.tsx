import { getServicesContainer } from "@/app/utils";
import {
  pageHeadersSearchParams,
  pageHeadersSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const PageHeadersTable: React.FC = async () => {
  const page = pageHeadersSearchParamsCache.get("page");
  const search = pageHeadersSearchParamsCache.get("search") || undefined;
  const limit = pageHeadersSearchParamsCache.get("limit");
  const sort = pageHeadersSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.pagesService.getPageHeaders({
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
      sortSchemaDefault={pageHeadersSearchParams.sort.defaultValue}
    />
  );
};
