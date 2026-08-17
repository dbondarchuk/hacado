import { getServicesContainer } from "@/app/utils";
import { pagesSearchParams, pagesSearchParamsCache } from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { isSmsLinkShorteningEnabled } from "@hacado/utils";
import { columns } from "./columns";
import { LinkShorteningEnabledProvider } from "./link-shortening-enabled-context";

export const PagesTable: React.FC = async () => {
  const page = pagesSearchParamsCache.get("page");
  const search = pagesSearchParamsCache.get("search") || undefined;
  const limit = pagesSearchParamsCache.get("limit");
  const published = pagesSearchParamsCache.get("published");
  const sort = pagesSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.pagesService.getPages({
    publishStatus: published,
    offset,
    limit,
    search,
    sort,
  });

  return (
    <LinkShorteningEnabledProvider enabled={isSmsLinkShorteningEnabled()}>
      <DataTable
        columns={columns}
        data={res.items}
        totalItems={res.total}
        sortSchemaDefault={pagesSearchParams.sort.defaultValue}
      />
    </LinkShorteningEnabledProvider>
  );
};
