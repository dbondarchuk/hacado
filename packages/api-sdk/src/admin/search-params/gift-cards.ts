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

import { giftCardStatus } from "@hacado/types";
import { baseSearchParams } from "./base";

export const giftCardsSearchParams = {
  ...baseSearchParams,
  status: parseAsArrayOf(parseAsStringEnum(giftCardStatus.flat())).withDefault([
    "active",
  ]),
  expiresAtStart: parseAsIsoDateTime,
  expiresAtEnd: parseAsIsoDateTime,
  customerId: parseAsArrayOf(parseAsString),
  priorityId: parseAsArrayOf(parseAsString),
  sort: baseSearchParams.sort.withDefault([
    {
      id: "updatedAt",
      desc: true,
    },
  ]),
};

export const giftCardsSearchParamsCache = createSearchParamsCache(
  giftCardsSearchParams,
);
export const giftCardsSearchParamsSerializer = createSerializer(
  giftCardsSearchParams,
);

export type GiftCardsSearchParams = Partial<
  inferParserType<typeof giftCardsSearchParams>
>;
export const giftCardsSearchParamsLoader = createLoader(giftCardsSearchParams);
export const giftCardsSearchParamsSchema = createStandardSchemaV1(
  giftCardsSearchParams,
);

export const checkGiftCardCodeUniqueSearchParams = {
  code: parseAsString,
  id: parseAsString,
};

export const checkGiftCardCodeUniqueParamsLoader = createLoader(
  checkGiftCardCodeUniqueSearchParams,
);
export const checkGiftCardCodeUniqueParamsSerializer = createSerializer(
  checkGiftCardCodeUniqueSearchParams,
);
