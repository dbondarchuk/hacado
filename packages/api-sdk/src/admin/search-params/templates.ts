import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs/server";

import { communicationChannels } from "@hacado/types";
import { baseSearchParams } from "./base";

export const templateSearchParams = {
  ...baseSearchParams,
  type: parseAsArrayOf(parseAsStringLiteral(communicationChannels)).withDefault(
    [...communicationChannels],
  ),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const templateSearchParamsCache =
  createSearchParamsCache(templateSearchParams);
export const templateSearchParamsSchema =
  createStandardSchemaV1(templateSearchParams);
export const templateSearchParamsSerializer =
  createSerializer(templateSearchParams);

export const templateSearchParamsLoader = createLoader(templateSearchParams);
export type TemplateSearchParams = Partial<
  inferParserType<typeof templateSearchParams>
>;
