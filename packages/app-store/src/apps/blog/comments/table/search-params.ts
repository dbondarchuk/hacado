import { baseSearchParams } from "@hacado/api-sdk";
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { blogCommentStatusSchema } from "../../models";

export const searchParams = {
  ...baseSearchParams,
  postId: parseAsArrayOf(parseAsString),
  status: parseAsArrayOf(parseAsStringEnum(blogCommentStatusSchema.options)),
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
