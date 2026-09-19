import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsString,
} from "nuqs/server";

import { baseSearchParams } from "./base";

export const addressesSearchParams = {
  ...baseSearchParams,
  limit: baseSearchParams.limit.withDefault(10),
  /** Soft country bias for autocomplete (ISO alpha-2, e.g. US). */
  country: parseAsString,
};

export const addressesSearchParamsCache = createSearchParamsCache(
  addressesSearchParams,
);
export const addressesSearchParamsSchema = createStandardSchemaV1(
  addressesSearchParams,
);
export const addressesSearchParamsSerializer = createSerializer(
  addressesSearchParams,
);

export const addressesSearchParamsLoader = createLoader(addressesSearchParams);
export type AddressesSearchParams = Partial<
  inferParserType<typeof addressesSearchParams>
>;
