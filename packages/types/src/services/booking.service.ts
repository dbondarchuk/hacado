import { AssetEntity } from "../assets";
import {
  ApplyGiftCardsSuccessResponse,
  Appointment,
  AppointmentEvent,
  AppointmentHistoryEntry,
  AppointmentStatus,
  AppointmentWithReferenceDateDistance,
  Availability,
  CalendarEvent,
  GetAppointmentOptionsResponse,
  GetAppointmentsQuery,
  GetAppointmentsQueryWithReferenceDate,
  Period,
} from "../booking";
import { Query, WithTotal } from "../database";
import type { EventSource } from "../events/envelope";

export interface IBookingService {
  getAvailability(
    duration: number,
    memberId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<Availability>;
  getBusyEventsInTimeFrame(
    start: Date,
    end: Date,
    options?: { memberId?: string },
  ): Promise<Period[]>;
  getBusyEvents(options?: { memberId?: string }): Promise<Period[]>;
  createAppointment(args: {
    event: AppointmentEvent;
    confirmed?: boolean;
    force?: boolean;
    files?: Record<string, File>;
    paymentIntentId?: string;
    eventSource: EventSource;
    giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
    /** Assigned staff member. Required going forward; when omitted, resolved server-side (owner fallback) for backward compat during migration. */
    memberId?: string;
    customerPackageId?: string;
    purchasePackageId?: string;
  }): Promise<Appointment>;
  updateAppointment(
    id: string,
    args: {
      event: AppointmentEvent;
      confirmed?: boolean;
      files?: Record<string, File>;
      doNotNotifyCustomer?: boolean;
      eventSource: EventSource;
    },
  ): Promise<Appointment>;
  getPendingAppointmentsCount(
    minimumDate?: Date,
    createdAfter?: Date,
    memberId?: string,
  ): Promise<{ totalCount: number; newCount: number }>;
  getPendingAppointments(
    limit?: number,
    after?: Date,
    memberId?: string,
  ): Promise<WithTotal<Appointment>>;
  getNextAppointments(
    date: Date,
    limit?: number,
    memberId?: string,
  ): Promise<Appointment[]>;
  getAppointments(
    query: Query & GetAppointmentsQueryWithReferenceDate,
  ): Promise<WithTotal<AppointmentWithReferenceDateDistance>>;
  getAppointments(
    query: Query & GetAppointmentsQuery,
  ): Promise<WithTotal<Appointment>>;
  getCalendarEvents(
    start: Date,
    end: Date,
    status: AppointmentStatus[],
    memberId?: string,
  ): Promise<CalendarEvent[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  findAppointmentByCustomerAndDateTime(
    customerId: string,
    dateTime: Date,
    status?: AppointmentStatus[],
  ): Promise<Appointment | null>;
  changeAppointmentStatus(
    id: string,
    newStatus: AppointmentStatus,
    eventSource: EventSource,
    doNotNotifyCustomer?: boolean,
  ): Promise<void>;
  updateAppointmentNote(id: string, note?: string): Promise<void>;
  addAppointmentFiles(
    id: string,
    files: File[],
    source: EventSource,
  ): Promise<AssetEntity[]>;
  rescheduleAppointment(
    id: string,
    newTime: Date,
    newDuration: number,
    eventSource: EventSource,
    doNotNotifyCustomer?: boolean,
  ): Promise<void>;

  getAppointmentHistory(
    query: Query & {
      appointmentId: string;
      type?: AppointmentHistoryEntry["type"];
    },
  ): Promise<WithTotal<AppointmentHistoryEntry>>;
  addAppointmentHistory(
    entry: Omit<AppointmentHistoryEntry, "_id" | "dateTime" | "organizationId">,
  ): Promise<string>;

  verifyTimeAvailability(
    dateTime: Date,
    duration: number,
    memberId: string,
  ): Promise<boolean>;
  getAppointmentOptions(opts?: {
    customerId?: string;
  }): Promise<GetAppointmentOptionsResponse>;
}
