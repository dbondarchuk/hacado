import { sortSchema } from "@hacado/types";
import { parseAsInteger, parseAsJson, parseAsString } from "nuqs/server";

export const baseSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString,
  sort: parseAsJson(sortSchema.parse),
};
