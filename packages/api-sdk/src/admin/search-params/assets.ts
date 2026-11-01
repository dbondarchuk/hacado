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

export const assetsSearchParams = {
  ...baseSearchParams,
  customerId: parseAsArrayOf(parseAsString),
  appointmentId: parseAsArrayOf(parseAsString),
  accept: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "uploadedAt",
      desc: true,
    },
  ]),
};

export const assetsSearchParamsCache =
  createSearchParamsCache(assetsSearchParams);

export const serializeAssetsSearchParams = createSerializer(assetsSearchParams);
export const assetsSearchParamsSchema =
  createStandardSchemaV1(assetsSearchParams);

export type AssetsSearchParams = Partial<
  inferParserType<typeof assetsSearchParams>
>;

export const assetsSearchParamsLoader = createLoader(assetsSearchParams);
