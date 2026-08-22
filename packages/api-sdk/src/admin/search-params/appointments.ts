import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";

import { appointmentStatuses } from "@hacado/types";
import { baseSearchParams } from "./base";

export const appointmentsSearchParams = {
  ...baseSearchParams,
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  status: parseAsArrayOf(parseAsStringLiteral(appointmentStatuses)).withDefault(
    ["confirmed", "pending"],
  ),
  customer: parseAsArrayOf(parseAsString),
  discount: parseAsArrayOf(parseAsString),
  member: parseAsArrayOf(parseAsString),
  package: parseAsArrayOf(parseAsString),
  customerPackageId: parseAsString,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "createdAt",
      desc: true,
    },
  ]),
  referenceDate: parseAsIsoDateTime,
};

export const appointmentsSearchParamsLoader = createLoader(
  appointmentsSearchParams,
);

export const appointmentsSearchParamsSchema = createStandardSchemaV1(
  appointmentsSearchParams,
);
export type AppointmentsSearchParams = Partial<
  inferParserType<typeof appointmentsSearchParams>
>;

export const appointmentsSearchParamsCache = createSearchParamsCache(
  appointmentsSearchParams,
);
export const serializeAppointmentsSearchParams = createSerializer(
  appointmentsSearchParams,
);
