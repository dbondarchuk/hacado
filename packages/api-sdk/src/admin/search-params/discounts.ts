import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { discountTypes } from "@hacado/types";
import { baseSearchParams } from "./base";

export const discountsSearchParams = {
  ...baseSearchParams,
  type: parseAsArrayOf(parseAsStringEnum(discountTypes.flat())).withDefault(
    discountTypes.flat(),
  ),
  enabled: parseAsArrayOf(parseAsBoolean).withDefault([true, false]),
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const discountsSearchParamsCache = createSearchParamsCache(
  discountsSearchParams,
);
export const discountsSearchParamsSerializer = createSerializer(
  discountsSearchParams,
);

export type DiscountsSearchParams = Partial<
  inferParserType<typeof discountsSearchParams>
>;
export const discountsSearchParamsLoader = createLoader(discountsSearchParams);
export const discountsSearchParamsSchema = createStandardSchemaV1(
  discountsSearchParams,
);

export const checkDiscountNameAndCodeSearchParams = {
  name: parseAsString,
  codes: parseAsArrayOf(parseAsString),
  id: parseAsString,
};

export const checkDiscountNameAndCodeParamsLoader = createLoader(
  checkDiscountNameAndCodeSearchParams,
);
export const checkDiscountNameAndCodeParamsSerializer = createSerializer(
  checkDiscountNameAndCodeSearchParams,
);
