import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  createStandardSchemaV1,
  inferParserType,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { paymentMethods, paymentType } from "@hacado/types";
import { baseSearchParams } from "./base";

export const paymentsSearchParams = {
  ...baseSearchParams,
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  customerId: parseAsArrayOf(parseAsString),
  appointmentId: parseAsArrayOf(parseAsString),
  type: parseAsArrayOf(parseAsStringEnum(paymentType.flat())),
  method: parseAsArrayOf(parseAsStringEnum(paymentMethods.flat())),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "paidAt",
      desc: true,
    },
  ]),
};

export const paymentsSearchParamsCache = createSearchParamsCache(
  paymentsSearchParams,
);
export const paymentsSearchParamsSerializer = createSerializer(
  paymentsSearchParams,
);

export type PaymentsSearchParams = Partial<
  inferParserType<typeof paymentsSearchParams>
>;
export const paymentsSearchParamsLoader = createLoader(paymentsSearchParams);
export const paymentsSearchParamsSchema = createStandardSchemaV1(
  paymentsSearchParams,
);
