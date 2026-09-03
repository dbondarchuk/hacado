import { baseSearchParams } from "@hacado/api-sdk";
import {
  createSerializer,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { waitlistStatus } from "../models";

export const searchParams = {
  ...baseSearchParams,
  status: parseAsArrayOf(
    parseAsStringEnum([...waitlistStatus, "expired"]),
  ).withDefault(["active"]),
  customer: parseAsArrayOf(parseAsString),
  option: parseAsArrayOf(parseAsString),
  member: parseAsArrayOf(parseAsString),
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

export const serialize = createSerializer(searchParams);
