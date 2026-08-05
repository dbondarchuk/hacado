import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsStringEnum,
} from "nuqs/server";

import { fieldTypes } from "@hacado/types";
import { baseSearchParams } from "./base";

export const serviceFieldsSearchParams = {
  ...baseSearchParams,
  type: parseAsArrayOf(parseAsStringEnum(fieldTypes.flat())).withDefault(
    fieldTypes.flat(),
  ),
  includeUsage: parseAsBoolean,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const serviceFieldsSearchParamsCache = createSearchParamsCache(
  serviceFieldsSearchParams,
);
export const serviceFieldsSearchParamsSchema = createStandardSchemaV1(
  serviceFieldsSearchParams,
);

export const serviceFieldsSearchParamsSerializer = createSerializer(
  serviceFieldsSearchParams,
);

export const serviceFieldsSearchParamsLoader = createLoader(
  serviceFieldsSearchParams,
);
export type ServiceFieldsSearchParams = Partial<
  inferParserType<typeof serviceFieldsSearchParams>
>;
