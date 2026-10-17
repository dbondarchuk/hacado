import type { ConnectedAppData } from "../connected-app.data";

export const CUSTOMER_APPOINTMENT_TEXT_MESSAGE_SCOPE =
  "customer-appointment-text-message" as const;

export type CustomerAppointmentTextOffer = {
  notifications: boolean;
  reminders: boolean;
  other: boolean;
};

export const emptyCustomerAppointmentTextOffer =
  (): CustomerAppointmentTextOffer => ({
    notifications: false,
    reminders: false,
    other: false,
  });

export interface ICustomerAppointmentTextMessage {
  getCustomerAppointmentTextOffer(
    appData: ConnectedAppData,
  ): Promise<CustomerAppointmentTextOffer>;
}
