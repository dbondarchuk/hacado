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

export const customersSearchParams = {
  ...baseSearchParams,
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "lastAppointment.dateTime",
      desc: true,
    },
  ]),
};

export const customersSearchParamsCache = createSearchParamsCache(
  customersSearchParams,
);

export const customersSearchParamsSchema = createStandardSchemaV1(
  customersSearchParams,
);

export const customersSearchParamsSerializer = createSerializer(
  customersSearchParams,
);

export const customersSearchParamsLoader = createLoader(customersSearchParams);
export type CustomersSearchParams = Partial<
  inferParserType<typeof customersSearchParams>
>;
