import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { baseSearchParams } from "./base";

const activitySeverities = ["info", "success", "warning", "error"] as const;
const activityActors = ["system", "member", "customer"] as const;

export const activitiesSearchParams = {
  ...baseSearchParams,
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  eventType: parseAsArrayOf(parseAsString),
  severity: parseAsArrayOf(
    parseAsStringLiteral([...activitySeverities]),
  ),
  actor: parseAsArrayOf(parseAsStringLiteral([...activityActors])),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "createdAt",
      desc: true,
    },
  ]),
};

export const activitiesSearchParamsCache = createSearchParamsCache(
  activitiesSearchParams,
);

export const serializeActivitiesSearchParams = createSerializer(
  activitiesSearchParams,
);

export const activitiesSearchParamsSchema = createStandardSchemaV1(
  activitiesSearchParams,
);

export type ActivitiesSearchParams = Partial<
  inferParserType<typeof activitiesSearchParams>
>;

export const activitiesSearchParamsLoader = createLoader(
  activitiesSearchParams,
);
