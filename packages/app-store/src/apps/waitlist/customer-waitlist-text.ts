import type { ConnectedAppData } from "@hacado/types/apps";

export const CUSTOMER_WAITLIST_TEXT_MESSAGE_SCOPE =
  "customer-waitlist-text-message" as const;

export type CustomerWaitlistTextOffer = {
  notifications: boolean;
  openSlot: boolean;
  other: boolean;
};

export const emptyCustomerWaitlistTextOffer =
  (): CustomerWaitlistTextOffer => ({
    notifications: false,
    openSlot: false,
    other: false,
  });

export interface ICustomerWaitlistTextMessage {
  getCustomerWaitlistTextOffer(
    appData: ConnectedAppData,
  ): Promise<CustomerWaitlistTextOffer>;
}
