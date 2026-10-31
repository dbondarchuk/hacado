import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

import { baseSearchParams } from "./base";

export const servicesSearchParams = {
  ...baseSearchParams,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
  priorityId: parseAsArrayOf(parseAsString),
};

export const servicesSearchParamsCache =
  createSearchParamsCache(servicesSearchParams);
export const servicesSearchParamsSchema =
  createStandardSchemaV1(servicesSearchParams);
export const servicesSearchParamsSerializer =
  createSerializer(servicesSearchParams);

export const servicesSearchParamsLoader = createLoader(servicesSearchParams);
export type ServicesSearchParams = Partial<
  inferParserType<typeof servicesSearchParams>
>;
