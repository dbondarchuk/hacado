import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsBoolean,
} from "nuqs/server";

import { baseSearchParams } from "./base";

export const addonsSearchParams = {
  ...baseSearchParams,
  includeUsage: parseAsBoolean,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const addonsSearchParamsCache =
  createSearchParamsCache(addonsSearchParams);

export const addonsSearchParamsSchema =
  createStandardSchemaV1(addonsSearchParams);

export const addonsSearchParamsSerializer =
  createSerializer(addonsSearchParams);

export const addonsSearchParamsLoader = createLoader(addonsSearchParams);
export type AddonsSearchParams = Partial<
  inferParserType<typeof addonsSearchParams>
>;
