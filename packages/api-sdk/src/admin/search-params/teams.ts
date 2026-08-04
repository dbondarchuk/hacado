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

import { MEMBER_STATUSES, USER_ROLES } from "@timelish/types";
import { baseSearchParams } from "./base";

export const teamsSearchParams = {
  ...baseSearchParams,
  priorityId: parseAsArrayOf(parseAsString),
  status: parseAsArrayOf(parseAsStringLiteral(MEMBER_STATUSES)).withDefault([
    "active",
  ]),
  role: parseAsArrayOf(parseAsStringLiteral(USER_ROLES)),
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "createdAt",
      desc: false,
    },
  ]),
};

export const teamsSearchParamsCache = createSearchParamsCache(teamsSearchParams);
export const teamsSearchParamsSchema = createStandardSchemaV1(teamsSearchParams);
export const teamsSearchParamsSerializer = createSerializer(teamsSearchParams);
export const teamsSearchParamsLoader = createLoader(teamsSearchParams);
export type TeamsSearchParams = Partial<
  inferParserType<typeof teamsSearchParams>
>;
