import { baseSearchParams } from "@hacado/api-sdk";
import { createSerializer, parseAsArrayOf, parseAsString } from "nuqs";

export const searchParams = {
  ...baseSearchParams,
  designId: parseAsArrayOf(parseAsString),
  customerId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([{ id: "createdAt", desc: true }]),
};

export const serialize = createSerializer(searchParams);
