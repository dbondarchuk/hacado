import {
  createSearchParamsCache,
  createSerializer,
  parseAsIsoDateTime,
  parseAsString,
} from "nuqs/server";

export const financialOverviewSearchParams = {
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  timeGrouping: parseAsString.withDefault("day"),
};

export const financialOverviewSearchParamsCache = createSearchParamsCache(
  financialOverviewSearchParams,
);

export const serializeFinancialOverviewSearchParams = createSerializer(
  financialOverviewSearchParams,
);
