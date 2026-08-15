import { getServicesContainer } from "@/app/utils";
import {
  giftCardsSearchParams,
  giftCardsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const GiftCardsTable: React.FC = async () => {
  const page = giftCardsSearchParamsCache.get("page");
  const search = giftCardsSearchParamsCache.get("search") || undefined;
  const start = giftCardsSearchParamsCache.get("expiresAtStart") || undefined;
  const end = giftCardsSearchParamsCache.get("expiresAtEnd") || undefined;
  const limit = giftCardsSearchParamsCache.get("limit");
  const status = giftCardsSearchParamsCache.get("status");
  const customerId = giftCardsSearchParamsCache.get("customerId");
  const sort = giftCardsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.giftCardsService.getGiftCards({
    status,
    customerId: customerId ?? undefined,
    expiresAt: start && end ? { start, end } : undefined,
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
      sortSchemaDefault={giftCardsSearchParams.sort.defaultValue}
    />
  );
};
