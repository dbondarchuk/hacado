import { BaseAllKeys } from "@hacado/i18n";
import {
  GIFT_CARD_CREATED_EVENT_TYPE,
  GIFT_CARD_DELETED_EVENT_TYPE,
  GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
  GIFT_CARD_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type GiftCardCreatedPayload,
  type GiftCardDeletedPayload,
  type GiftCardStatusChangedPayload,
  type GiftCardUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const GIFT_CARD_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [GIFT_CARD_CREATED_EVENT_TYPE]: {
    type: GIFT_CARD_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { giftCard } = envelope.payload as GiftCardCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.giftCard.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.giftCard.created.description" satisfies BaseAllKeys,
          args: { code: giftCard.code },
        },
        source: envelope.source,
        link: dashboardUrls.giftCard(giftCard._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [GIFT_CARD_UPDATED_EVENT_TYPE]: {
    type: GIFT_CARD_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { giftCard } = envelope.payload as GiftCardUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.giftCard.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.giftCard.updated.description" satisfies BaseAllKeys,
          args: { code: giftCard.code },
        },
        source: envelope.source,
        link: dashboardUrls.giftCard(giftCard._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [GIFT_CARD_STATUS_CHANGED_EVENT_TYPE]: {
    type: GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { ids, status } = envelope.payload as GiftCardStatusChangedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.giftCard.statusChanged.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.giftCard.statusChanged.description" satisfies BaseAllKeys,
          args: { count: ids.length, status },
        },
        source: envelope.source,
        link: dashboardUrls.giftCards,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [GIFT_CARD_DELETED_EVENT_TYPE]: {
    type: GIFT_CARD_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { giftCardIds } = envelope.payload as GiftCardDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.giftCard.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.giftCard.deleted.description" satisfies BaseAllKeys,
          args: { count: giftCardIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.giftCards,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
