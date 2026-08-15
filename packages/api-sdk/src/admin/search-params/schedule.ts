import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsIsoDateTime,
  parseAsString,
} from "nuqs/server";

export const scheduleSearchParams = {
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  member: parseAsString,
};

export type ScheduleSearchParams = inferParserType<typeof scheduleSearchParams>;
export const scheduleSearchParamsSchema =
  createStandardSchemaV1(scheduleSearchParams);
export const scheduleSearchParamsCache =
  createSearchParamsCache(scheduleSearchParams);
export const scheduleSearchParamsLoader = createLoader(scheduleSearchParams);
export const serializeScheduleSearchParams =
  createSerializer(scheduleSearchParams);
