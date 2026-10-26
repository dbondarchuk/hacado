import { GIFT_CARD_STUDIO_APP_NAME } from "../const";
import type {
  PrefixedKeys as GiftCardStudioAdminAllKeys,
  Keys as GiftCardStudioAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as GiftCardStudioPublicAllKeys,
  Keys as GiftCardStudioPublicKeys,
} from "./en/public.keys";

export type {
  GiftCardStudioAdminAllKeys,
  GiftCardStudioAdminKeys,
  GiftCardStudioPublicAllKeys,
  GiftCardStudioPublicKeys,
};

export const giftCardStudioAdminNamespace =
  `app_${GIFT_CARD_STUDIO_APP_NAME}_admin` as const;

export type GiftCardStudioAdminNamespace = typeof giftCardStudioAdminNamespace;

export const giftCardStudioPublicNamespace =
  `app_${GIFT_CARD_STUDIO_APP_NAME}_public` as const;

export type GiftCardStudioPublicNamespace =
  typeof giftCardStudioPublicNamespace;
