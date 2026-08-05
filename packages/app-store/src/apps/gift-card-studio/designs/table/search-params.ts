import { baseSearchParams } from "@hacado/api-sdk";
import {
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
} from "nuqs";

export const searchParams = {
  ...baseSearchParams,
  isArchived: parseAsArrayOf(parseAsBoolean).withDefault([false]),
  sort: baseSearchParams.sort.withDefault([{ id: "createdAt", desc: true }]),
  ts: parseAsString,
};

export const serialize = createSerializer(searchParams);
