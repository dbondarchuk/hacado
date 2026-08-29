import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs/server";

import { baseSearchParams } from "./base";

export const pagesSearchParams = {
  ...baseSearchParams,
  published: parseAsArrayOf(parseAsBoolean).withDefault([true, false]),
  tags: parseAsArrayOf(parseAsString),
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const pagesSearchParamsCache =
  createSearchParamsCache(pagesSearchParams);
export const pagesSearchParamsSchema =
  createStandardSchemaV1(pagesSearchParams);
export const pagesSearchParamsSerializer = createSerializer(pagesSearchParams);

export const pagesSearchParamsLoader = createLoader(pagesSearchParams);
export type PagesSearchParams = Partial<
  inferParserType<typeof pagesSearchParams>
>;

export const pageHeadersSearchParams = {
  ...baseSearchParams,
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const pageHeadersSearchParamsCache = createSearchParamsCache(
  pageHeadersSearchParams,
);
export const pageHeadersSearchParamsSchema = createStandardSchemaV1(
  pageHeadersSearchParams,
);
export const pageHeadersSearchParamsSerializer = createSerializer(
  pageHeadersSearchParams,
);

export const pageHeadersSearchParamsLoader = createLoader(
  pageHeadersSearchParams,
);
export type PageHeadersSearchParams = Partial<
  inferParserType<typeof pageHeadersSearchParams>
>;

export const pageFootersSearchParams = {
  ...baseSearchParams,
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const pageFootersSearchParamsCache = createSearchParamsCache(
  pageFootersSearchParams,
);
export const pageFootersSearchParamsSchema = createStandardSchemaV1(
  pageFootersSearchParams,
);
export const pageFootersSearchParamsSerializer = createSerializer(
  pageFootersSearchParams,
);

export const pageFootersSearchParamsLoader = createLoader(
  pageFootersSearchParams,
);
export type PageFootersSearchParams = Partial<
  inferParserType<typeof pageFootersSearchParams>
>;
