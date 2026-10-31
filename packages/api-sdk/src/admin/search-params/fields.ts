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

import { fieldTypes } from "@hacado/types/booking";
import { baseSearchParams } from "./base";

export const fieldsSearchParams = {
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

export const fieldsSearchParamsCache =
  createSearchParamsCache(fieldsSearchParams);
export const fieldsSearchParamsSchema =
  createStandardSchemaV1(fieldsSearchParams);

export const fieldsSearchParamsSerializer =
  createSerializer(fieldsSearchParams);

export const fieldsSearchParamsLoader = createLoader(fieldsSearchParams);
export type FieldsSearchParams = Partial<
  inferParserType<typeof fieldsSearchParams>
>;
