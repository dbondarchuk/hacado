import { getServicesContainer } from "@/app/utils";
import {
  soldPackagesSearchParams,
  soldPackagesSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { soldPackageColumns } from "./columns";

export const SoldPackagesTable: React.FC = async () => {
  const page = soldPackagesSearchParamsCache.get("page");
  const search = soldPackagesSearchParamsCache.get("search") || undefined;
  const limit = soldPackagesSearchParamsCache.get("limit");
  const status = soldPackagesSearchParamsCache.get("status");
  const sort = soldPackagesSearchParamsCache.get("sort");
  const customerId =
    soldPackagesSearchParamsCache.get("customerId") || undefined;
  const packageId = soldPackagesSearchParamsCache.get("packageId") || undefined;
  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.packagesService.getCustomerPackages({
    status: status ?? undefined,
    offset,
    limit,
    search,
    sort,
    customerId,
    packageId,
  });

  return (
    <DataTable
      columns={soldPackageColumns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={soldPackagesSearchParams.sort.defaultValue}
    />
  );
};
