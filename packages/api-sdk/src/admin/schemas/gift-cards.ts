import { giftCardStatus, zNonEmptyString } from "@hacado/types";
import * as z from "zod";

export const setGiftCardStatusSchema = z.object({
  status: z.enum(giftCardStatus),
});

export const setGiftCardsStatusSchema = z.object({
  ids: z
    .array(zNonEmptyString("ID is required"))
    .min(1, "At least one ID is required"),
  status: z.enum(giftCardStatus),
});
