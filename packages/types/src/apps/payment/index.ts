import { Payment, PaymentIntent, PaymentType } from "../../booking";
import { ConnectedAppData } from "../connected-app.data";

export interface IPaymentProcessor {
  getFormProps: (appData: ConnectedAppData) => Record<string, any>;
  refundPayment?: (
    appDate: ConnectedAppData,
    payment: Payment,
    amount: number,
  ) => Promise<{ success: boolean; error?: string }>;
  getApplePayDomainAssociation?: (
    appData: ConnectedAppData,
  ) => Promise<string | null>;
}

export type PaymentAppFormProps<T extends Record<string, any>> = {
  intent: PaymentIntent;
  onSubmit: () => void;
} & T;

export type CreatePaymentLinkRequest = {
  amount: number;
  customerId: string;
  appointmentId?: string;
  description: string;
  type: PaymentType;
  paymentId: string;
  expiresAt?: Date;
};

export type PaymentLinkResult = {
  id: string;
  url: string;
  hostedOn: "hacado" | "external";
  expiresAt?: Date;
};

export type SendPaymentLinkRequest = {
  channel: "email" | "sms";
  to: string;
};

/**
 * Apps that declare the `payment-link` scope implement this interface so
 * Collect payment (and future callers) can create/send hosted payment links.
 */
export interface IPaymentLinkProvider {
  createPaymentLink(
    appData: ConnectedAppData,
    request: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResult>;

  sendPaymentLink?(
    appData: ConnectedAppData,
    payment: Payment,
    request: SendPaymentLinkRequest,
  ): Promise<void>;

  cancelPaymentLink?(
    appData: ConnectedAppData,
    payment: Payment,
  ): Promise<void>;
}
