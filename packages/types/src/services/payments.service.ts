import {
  AppointmentRequest,
  Payment,
  PaymentExportRow,
  PaymentIntent,
  PaymentIntentUpdateModel,
  PaymentMethod,
  PaymentSummary,
  PaymentType,
  PaymentUpdateModel,
} from "../booking";
import { Query, WithTotal } from "../database";
import type { EventSource } from "../events/envelope";
import { DateRange } from "../general";

export interface IPaymentsService {
  createIntent(
    intent: Omit<PaymentIntentUpdateModel, "status">,
  ): Promise<PaymentIntent>;

  getIntent(id: string): Promise<PaymentIntent | null>;
  getIntentByExternalId(externalId: string): Promise<PaymentIntent | null>;
  findReusablePaidIntentForAppointmentRequest(args: {
    appId: string;
    amount: number;
    type: Exclude<PaymentType, "rescheduleFee" | "cancellationFee">;
    request: AppointmentRequest;
  }): Promise<PaymentIntent | null>;

  matchesAppointmentRequestPaidIntent(
    intent: PaymentIntent,
    args: {
      appId: string;
      amount: number;
      type: Exclude<PaymentType, "rescheduleFee" | "cancellationFee">;
      request: AppointmentRequest;
    },
  ): boolean;

  updateIntent(
    id: string,
    update: Partial<PaymentIntentUpdateModel>,
  ): Promise<PaymentIntent>;

  createPayment(
    payment: PaymentUpdateModel,
    source: EventSource,
  ): Promise<Payment>;

  list(
    query: Query & {
      range?: DateRange;
      customerId?: string;
      appointmentId?: string;
      type?: PaymentType[];
      method?: PaymentMethod[];
    },
  ): Promise<WithTotal<PaymentSummary>>;

  listForExport(
    query: Omit<Query, "offset" | "limit"> & {
      range?: DateRange;
      customerId?: string;
      appointmentId?: string;
      type?: PaymentType[];
      method?: PaymentMethod[];
    },
  ): Promise<PaymentExportRow[]>;

  getPayment(id: string): Promise<Payment | null>;
  getPaymentByExternalId(externalId: string): Promise<Payment | null>;
  getAppointmentPayments(appointmentId: string): Promise<Payment[]>;

  updatePayment(
    id: string,
    update: Partial<PaymentUpdateModel>,
    source: EventSource,
  ): Promise<Payment>;

  deletePayment(id: string, source: EventSource): Promise<Payment | null>;

  refundPayment(
    id: string,
    amount: number,
    source: EventSource,
  ): Promise<
    | { success: false; error: string; status: number }
    | { success: true; updatedPayment: Payment }
  >;
}
