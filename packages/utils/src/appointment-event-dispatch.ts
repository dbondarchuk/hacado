import type { EventEnvelope, EventSource, UserRole } from "@hacado/types";
import {
  APPOINTMENT_CREATED_EVENT_TYPE,
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
  type Appointment,
  type AppointmentCreatedPayload,
  type AppointmentRescheduledPayload,
  type AppointmentSlotRescheduledPayload,
  type AppointmentStatus,
  type AppointmentStatusChangedPayload,
} from "@hacado/types";
import { roleCanProcessOtherMembersAppointments } from "./permissions";

/**
 * Maps core `appointment.*` envelopes to legacy hook-style callbacks used by notification/calendar apps.
 */
export type AppointmentEventDispatchHandlers = {
  onAppointmentCreated?: (
    appointment: Appointment,
    confirmed: boolean,
    source: EventSource,
  ) => Promise<void>;
  onAppointmentFullRescheduled?: (
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    oldTime: Date | undefined,
    oldDuration: number | undefined,
    doNotNotifyCustomer: boolean | undefined,
    source: EventSource,
  ) => Promise<void>;
  onAppointmentSlotRescheduled?: (
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    oldTime: Date | undefined,
    oldDuration: number | undefined,
    doNotNotifyCustomer: boolean | undefined,
    source: EventSource,
  ) => Promise<void>;
  onAppointmentStatusChanged?: (
    appointment: Appointment,
    newStatus: AppointmentStatus,
    oldStatus: AppointmentStatus | undefined,
    source: EventSource,
    doNotNotifyCustomer: boolean | undefined,
  ) => Promise<void>;
};

/**
 * Resolves `forMemberId` for member-targeted appointment apps.
 * Returns `undefined` (all appointments) only when the flag is on, the plan
 * allows multiple users, and the installer's role still grants readAll +
 * updateAll; otherwise the app member id.
 */
export async function resolveAppointmentEventForMemberId(
  getMemberRole: (memberId: string) => Promise<UserRole | null>,
  appMemberId: string,
  processOtherMembersAppointments?: boolean,
  allowsMultipleUsers?: boolean,
): Promise<string | undefined> {
  if (!processOtherMembersAppointments || !allowsMultipleUsers) {
    return appMemberId;
  }

  const role = await getMemberRole(appMemberId);
  if (!roleCanProcessOtherMembersAppointments(role)) {
    return appMemberId;
  }

  return undefined;
}

/** Returns true if the envelope was an appointment event and a handler ran. */
export async function dispatchAppointmentEventPayload(
  envelope: EventEnvelope,
  handlers: AppointmentEventDispatchHandlers,
  forMemberId?: string,
): Promise<boolean> {
  switch (envelope.type) {
    case APPOINTMENT_CREATED_EVENT_TYPE: {
      if (!handlers.onAppointmentCreated) {
        return false;
      }

      const p = envelope.payload as AppointmentCreatedPayload;

      if (forMemberId && p.appointment.memberId !== forMemberId) {
        return false;
      }

      await handlers.onAppointmentCreated(
        p.appointment,
        p.confirmed,
        envelope.source,
      );
      return true;
    }
    case APPOINTMENT_RESCHEDULED_EVENT_TYPE: {
      if (!handlers.onAppointmentFullRescheduled) {
        return false;
      }

      const p = envelope.payload as AppointmentRescheduledPayload;

      if (forMemberId && p.updatedAppointment.memberId !== forMemberId) {
        return false;
      }

      await handlers.onAppointmentFullRescheduled(
        p.updatedAppointment,
        p.dateTime,
        p.totalDuration,
        p.previousDateTime,
        p.previousTotalDuration,
        p.doNotNotifyCustomer,
        envelope.source,
      );
      return true;
    }
    case APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE: {
      if (!handlers.onAppointmentSlotRescheduled) {
        return false;
      }

      const p = envelope.payload as AppointmentSlotRescheduledPayload;

      if (forMemberId && p.appointment.memberId !== forMemberId) {
        return false;
      }

      await handlers.onAppointmentSlotRescheduled(
        p.appointment,
        p.newTime,
        p.newDuration,
        p.oldTime,
        p.oldDuration,
        p.doNotNotifyCustomer,
        envelope.source,
      );
      return true;
    }
    case APPOINTMENT_STATUS_CHANGED_EVENT_TYPE: {
      if (!handlers.onAppointmentStatusChanged) {
        return false;
      }

      const p = envelope.payload as AppointmentStatusChangedPayload;

      if (forMemberId && p.appointment.memberId !== forMemberId) {
        return false;
      }

      await handlers.onAppointmentStatusChanged(
        p.appointment,
        p.newStatus,
        p.oldStatus,
        envelope.source,
        p.doNotNotifyCustomer,
      );
      return true;
    }
    default:
      return false;
  }
}
