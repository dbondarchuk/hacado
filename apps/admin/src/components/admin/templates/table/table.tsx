import { getServicesContainer } from "@/app/utils";
import {
  templateSearchParams,
  templateSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const TemplatesTable: React.FC = async () => {
  const page = templateSearchParamsCache.get("page");
  const search = templateSearchParamsCache.get("search") || undefined;
  const limit = templateSearchParamsCache.get("limit");
  const sort = templateSearchParamsCache.get("sort");
  const type = templateSearchParamsCache.get("type");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.templatesService.getTemplates({
    offset,
    limit,
    search,
    sort,
    type,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={templateSearchParams.sort.defaultValue}
    />
  );
};
