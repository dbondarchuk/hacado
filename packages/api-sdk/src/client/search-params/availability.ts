import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const availabilitySearchParams = {
  memberIds: parseAsArrayOf(parseAsString),
  durations: parseAsArrayOf(parseAsInteger),
};

export const availabilitySearchParamsCache = createSearchParamsCache(
  availabilitySearchParams,
);

export const serializeAvailabilitySearchParams = createSerializer(
  availabilitySearchParams,
);

export const availabilitySearchParamsLoader = createLoader(
  availabilitySearchParams,
);

export const availabilitySearchParamsSchema = createStandardSchemaV1(
  availabilitySearchParams,
);

export type AvailabilitySearchParams = Partial<
  inferParserType<typeof availabilitySearchParams>
>;
