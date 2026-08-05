import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { GIFT_CARD_STUDIO_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type GiftCardStudioAdminKeys = Leaves<typeof adminKeys>;
export const giftCardStudioAdminNamespace = `app_${GIFT_CARD_STUDIO_APP_NAME}_admin` as const;

export type GiftCardStudioAdminNamespace = typeof giftCardStudioAdminNamespace;

export type GiftCardStudioPublicKeys = Leaves<typeof publicKeys>;
export const giftCardStudioPublicNamespace = `app_${GIFT_CARD_STUDIO_APP_NAME}_public` as const;

export type GiftCardStudioPublicNamespace = typeof giftCardStudioPublicNamespace;

export type GiftCardStudioAdminAllKeys = AllKeys<
  GiftCardStudioAdminNamespace,
  GiftCardStudioAdminKeys
>;

export type GiftCardStudioPublicAllKeys = AllKeys<
  GiftCardStudioPublicNamespace,
  GiftCardStudioPublicKeys
>;
