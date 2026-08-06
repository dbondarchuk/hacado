import { baseSearchParams } from "@hacado/api-sdk";
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString } from "nuqs";

export const searchParams = {
  ...baseSearchParams,
  formId: parseAsArrayOf(parseAsString),
  customerId: parseAsArrayOf(parseAsString),
  start: parseAsIsoDateTime,
  end: parseAsIsoDateTime,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "createdAt",
      desc: true,
    },
  ]),
  ts: parseAsString,
};
