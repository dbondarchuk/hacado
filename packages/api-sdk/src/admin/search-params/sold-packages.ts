import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { customerPackageStatuses } from "@hacado/types";
import { baseSearchParams } from "./base";

export const soldPackagesSearchParams = {
  ...baseSearchParams,
  status: parseAsArrayOf(parseAsStringEnum([...customerPackageStatuses])),
  customerId: parseAsArrayOf(parseAsString),
  packageId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "purchasedAt",
      desc: true,
    },
  ]),
};

export const soldPackagesSearchParamsCache = createSearchParamsCache(
  soldPackagesSearchParams,
);
export const soldPackagesSearchParamsSerializer = createSerializer(
  soldPackagesSearchParams,
);

export type SoldPackagesSearchParams = Partial<
  inferParserType<typeof soldPackagesSearchParams>
>;
export const soldPackagesSearchParamsLoader = createLoader(
  soldPackagesSearchParams,
);
export const soldPackagesSearchParamsSchema = createStandardSchemaV1(
  soldPackagesSearchParams,
);
