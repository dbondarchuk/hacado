import { getServicesContainer } from "@/app/utils";
import {
  pageFootersSearchParams,
  pageFootersSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const PageFootersTable: React.FC = async () => {
  const page = pageFootersSearchParamsCache.get("page");
  const search = pageFootersSearchParamsCache.get("search") || undefined;
  const limit = pageFootersSearchParamsCache.get("limit");
  const sort = pageFootersSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.pagesService.getPageFooters({
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
      sortSchemaDefault={pageFootersSearchParams.sort.defaultValue}
    />
  );
};
