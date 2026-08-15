import type { AppEventConfig, EventDefinition } from "@hacado/types";
import { formatAmountWithCurrency } from "@hacado/utils";
import { GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY } from "./const";
import { buildNewPurchaseEmailNotifications } from "./emails/new-purchase-email";
import {
  GIFT_CARD_STUDIO_DESIGN_CREATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE,
  GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_PURCHASE_DELETED_EVENT_TYPE,
  type GiftCardStudioDesignCreatedPayload,
  type GiftCardStudioDesignDeletedPayload,
  type GiftCardStudioDesignUpdatedPayload,
  type GiftCardStudioPurchaseCreatedPayload,
  type GiftCardStudioPurchaseDeletedPayload,
} from "./models/events";
import type { GiftCardStudioSettings } from "./models/settings";
import { GiftCardStudioAdminAllKeys } from "./translations/types";

export const GIFT_CARD_STUDIO_APP_EVENTS: AppEventConfig = {
  events: [
    {
      type: GIFT_CARD_STUDIO_DESIGN_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { design } =
          envelope.payload as GiftCardStudioDesignCreatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_gift-card-studio_admin.events.designCreated.title" satisfies GiftCardStudioAdminAllKeys,
          },
          description: {
            key: "app_gift-card-studio_admin.events.designCreated.description" satisfies GiftCardStudioAdminAllKeys,
            args: { designName: design.name },
          },
          link: `/dashboard/gift-card-studio/edit?id=${design._id}`,
          source: envelope.source,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<GiftCardStudioDesignCreatedPayload>,
    {
      type: GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { design } =
          envelope.payload as GiftCardStudioDesignUpdatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_gift-card-studio_admin.events.designUpdated.title" satisfies GiftCardStudioAdminAllKeys,
          },
          description: {
            key: "app_gift-card-studio_admin.events.designUpdated.description" satisfies GiftCardStudioAdminAllKeys,
            args: { designName: design.name },
          },
          link: `/dashboard/gift-card-studio/edit?id=${design._id}`,
          source: envelope.source,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<GiftCardStudioDesignUpdatedPayload>,
    {
      type: GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const payload = envelope.payload as GiftCardStudioDesignDeletedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_gift-card-studio_admin.events.designDeleted.title" satisfies GiftCardStudioAdminAllKeys,
          },
          description: {
            key: "app_gift-card-studio_admin.events.designDeleted.description" satisfies GiftCardStudioAdminAllKeys,
            args: { designName: payload.designName ?? "" },
          },
          link: "/dashboard/gift-card-studio",
          source: envelope.source,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<GiftCardStudioDesignDeletedPayload>,
    {
      type: GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { purchase } =
          envelope.payload as GiftCardStudioPurchaseCreatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_gift-card-studio_admin.events.purchaseCreated.title" satisfies GiftCardStudioAdminAllKeys,
          },
          description: {
            key: "app_gift-card-studio_admin.events.purchaseCreated.description" satisfies GiftCardStudioAdminAllKeys,
            args: {
              designName: purchase.designName,
              amount: purchase.amountPurchased,
              customerName: purchase.customerName ?? "",
            },
          },
          link: `/dashboard/gift-card-studio/purchases?purchaseId=${purchase._id}`,
          source: envelope.source,
        };
      },
      dashboardNotification: (envelope) => {
        if (envelope.source.actor !== "customer") {
          return null;
        }

        const { purchase } =
          envelope.payload as GiftCardStudioPurchaseCreatedPayload;

        return {
          type: "gift-card-studio-purchase-created",
          incrementBadgeKey: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY,
          toast: {
            type: "info",
            title: {
              key: "app_gift-card-studio_admin.notifications.newPurchase.title" satisfies GiftCardStudioAdminAllKeys,
            },
            message: {
              key: "app_gift-card-studio_admin.notifications.newPurchase.message" satisfies GiftCardStudioAdminAllKeys,
            },
            action: {
              label: {
                key: "app_gift-card-studio_admin.notifications.newPurchase.view" satisfies GiftCardStudioAdminAllKeys,
              },
              href: `/dashboard/gift-card-studio/purchases?purchaseId=${purchase._id}`,
            },
          },
        };
      },
      emailNotifications: async (envelope, services) => {
        if (envelope.source.actor !== "customer") {
          return null;
        }

        const payload =
          envelope.payload as GiftCardStudioPurchaseCreatedPayload;

        let app;
        try {
          app = await services.connectedAppsService.getApp(payload.appId);
        } catch {
          return null;
        }

        const settings = (app.data ?? {}) as Partial<GiftCardStudioSettings>;
        if (!settings.notifyOwnerOnPurchase) {
          return null;
        }

        const admins =
          await services.teamService.getOrganizationAdminContacts();
        if (!admins.length) {
          return null;
        }

        const organization =
          await services.organizationService.getOrganization();
        const organizationLabel =
          organization?.name?.trim() || organization?.slug || "";

        const { general, brand } =
          await services.configurationService.getConfigurations(
            "general",
            "brand",
          );

        const amountFormatted = formatAmountWithCurrency(
          payload.purchase.amountPurchased,
          brand.language,
          general.currency,
        );

        return buildNewPurchaseEmailNotifications(
          payload,
          admins,
          amountFormatted,
          organizationLabel ? { config: { name: organizationLabel } } : {},
        );
      },
      smsNotifications: false,
    } as EventDefinition<GiftCardStudioPurchaseCreatedPayload>,
    {
      type: GIFT_CARD_STUDIO_PURCHASE_DELETED_EVENT_TYPE,
      recordActivity: (envelope) => ({
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "app_gift-card-studio_admin.events.purchaseDeleted.title" satisfies GiftCardStudioAdminAllKeys,
        },
        description: {
          key: "app_gift-card-studio_admin.events.purchaseDeleted.description" satisfies GiftCardStudioAdminAllKeys,
        },
        link: "/dashboard/gift-card-studio/purchases",
        source: envelope.source,
      }),
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<GiftCardStudioPurchaseDeletedPayload>,
  ],
};
