import { baseSearchParams } from "@hacado/api-sdk/admin/search-params/base";
import { createSerializer } from "nuqs";

export const searchParams = {
  ...baseSearchParams,
  sort: baseSearchParams.sort.withDefault([
    {
      id: "publicationDate",
      desc: true,
    },
  ]),
};

export const serialize = createSerializer(searchParams);
