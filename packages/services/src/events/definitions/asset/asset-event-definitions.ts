import { BaseAllKeys } from "@hacado/i18n";
import {
  ASSET_CREATED_EVENT_TYPE,
  ASSET_DELETED_EVENT_TYPE,
  ASSET_UPDATED_EVENT_TYPE,
  type AssetCreatedPayload,
  type AssetDeletedPayload,
  type AssetUpdatedPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const ASSET_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [ASSET_CREATED_EVENT_TYPE]: {
    type: ASSET_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { asset } = envelope.payload as AssetCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.asset.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.asset.created.description" satisfies BaseAllKeys,
          args: { filename: asset.filename },
        },
        source: envelope.source,
        link: dashboardUrls.asset(asset._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [ASSET_UPDATED_EVENT_TYPE]: {
    type: ASSET_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { asset } = envelope.payload as AssetUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.asset.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.asset.updated.description" satisfies BaseAllKeys,
          args: { filename: asset.filename },
        },
        source: envelope.source,
        link: dashboardUrls.asset(asset._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [ASSET_DELETED_EVENT_TYPE]: {
    type: ASSET_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { assetIds } = envelope.payload as AssetDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.asset.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.asset.deleted.description" satisfies BaseAllKeys,
          args: { count: assetIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.assets,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
