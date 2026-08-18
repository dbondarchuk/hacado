import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsBoolean,
  parseAsIsoDateTime,
  parseAsString,
} from "nuqs/server";
export const calendarSearchParams = {
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  includeClosed: parseAsBoolean.withDefault(false),
  member: parseAsString,
};

export const calendarSearchParamsLoader = createLoader(calendarSearchParams);
export const calendarSearchParamsSchema =
  createStandardSchemaV1(calendarSearchParams);
export type CalendarSearchParams = Partial<
  inferParserType<typeof calendarSearchParams>
>;
export const calendarSearchParamsCache =
  createSearchParamsCache(calendarSearchParams);
export const serializeCalendarSearchParams =
  createSerializer(calendarSearchParams);
