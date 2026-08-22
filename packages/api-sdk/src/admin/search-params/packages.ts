import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { appointmentPackageStatuses } from "@hacado/types";
import { baseSearchParams } from "./base";

export const packagesSearchParams = {
  ...baseSearchParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...appointmentPackageStatuses]),
  ).withDefault([...appointmentPackageStatuses]),
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const packagesSearchParamsCache =
  createSearchParamsCache(packagesSearchParams);
export const packagesSearchParamsSerializer =
  createSerializer(packagesSearchParams);

export type PackagesSearchParams = Partial<
  inferParserType<typeof packagesSearchParams>
>;
export const packagesSearchParamsLoader = createLoader(packagesSearchParams);
export const packagesSearchParamsSchema =
  createStandardSchemaV1(packagesSearchParams);
