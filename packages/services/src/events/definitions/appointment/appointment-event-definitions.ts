import { BaseAllKeys } from "@hacado/i18n";
import {
  APPOINTMENT_CREATED_EVENT_TYPE,
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
  type AppointmentCreatedPayload,
  type AppointmentRescheduledPayload,
  type AppointmentSlotRescheduledPayload,
  type AppointmentStatusChangedPayload,
  type EventDefinition,
} from "@hacado/types";
import { durationToTime } from "@hacado/utils";

import { buildAppointmentLimitReachedEmails } from "./appointment-limit-email";

function pendingAppointmentsBadges(
  count: number,
): { key: string; count: number }[] {
  return [
    {
      key: "pending_appointments",
      count,
    },
  ];
}

export const APPOINTMENT_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [APPOINTMENT_CREATED_EVENT_TYPE]: {
    type: APPOINTMENT_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppointmentCreatedPayload;
      const { appointment } = payload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.appointments.events.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.appointments.events.created.description" satisfies BaseAllKeys,
          args: {
            customerName: appointment.customer.name,
            serviceName: appointment.option.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${appointment._id}`,
      };
    },
    dashboardNotification: async (envelope, services) => {
      const payload = envelope.payload as AppointmentCreatedPayload;
      if (envelope.source.actor !== "customer") {
        return null;
      }
      const pendingAppointments =
        await services.bookingService.getPendingAppointmentsCount(new Date());
      const duration = durationToTime(payload.appointment.totalDuration);
      return {
        type: "appointment-created",
        badges: pendingAppointmentsBadges(pendingAppointments.totalCount),
        toast: {
          type: "info",
          title: {
            key: "admin.appointments.notifications.appointmentCreated.title" satisfies BaseAllKeys,
          },
          message: {
            key: "admin.appointments.notifications.appointmentCreated.message" satisfies BaseAllKeys,
            args: {
              name: payload.appointment.customer.name,
              service: payload.appointment.option.name,
              dt_dateTime: {
                value: payload.appointment.dateTime.toISOString(),
                format: "DATETIME_HUGE",
              },
              durationHours: duration.hours,
              durationMinutes: duration.minutes,
            },
          },
          action: {
            label: {
              key: "admin.appointments.notifications.appointmentCreated.action" satisfies BaseAllKeys,
            },
            href: `/dashboard/appointments/${payload.appointment._id}`,
          },
        },
      };
    },
    emailNotifications: buildAppointmentLimitReachedEmails,
    smsNotifications: false,
  },
  [APPOINTMENT_RESCHEDULED_EVENT_TYPE]: {
    type: APPOINTMENT_RESCHEDULED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppointmentRescheduledPayload;
      const { updatedAppointment } = payload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.appointments.events.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.appointments.events.updated.description" satisfies BaseAllKeys,
          args: {
            customerName: updatedAppointment.customer.name,
            serviceName: updatedAppointment.option.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${updatedAppointment._id}`,
      };
    },
    dashboardNotification: async (envelope, services) => {
      const payload = envelope.payload as AppointmentRescheduledPayload;
      const pendingAppointments =
        await services.bookingService.getPendingAppointmentsCount(new Date());
      return {
        type: "appointment-updated",
        badges: pendingAppointmentsBadges(pendingAppointments.totalCount),
        toast:
          envelope.source.actor === "customer"
            ? {
                type: "info",
                title: {
                  key: "admin.appointments.notifications.appointmentRescheduled.title" satisfies BaseAllKeys,
                },
                message: {
                  key: "admin.appointments.notifications.appointmentRescheduled.message" satisfies BaseAllKeys,
                  args: {
                    name: payload.updatedAppointment.customer.name,
                    service: payload.updatedAppointment.option.name,
                  },
                },
                action: {
                  label: {
                    key: "admin.appointments.notifications.appointmentRescheduled.action" satisfies BaseAllKeys,
                  },
                  href: `/dashboard/appointments/${payload.updatedAppointment._id}`,
                },
              }
            : undefined,
      };
    },
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_STATUS_CHANGED_EVENT_TYPE]: {
    type: APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppointmentStatusChangedPayload;
      const { appointment, newStatus, oldStatus } = payload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.appointments.events.statusChanged.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.appointments.events.statusChanged.description" satisfies BaseAllKeys,
          args: {
            customerName: appointment.customer.name,
            oldStatus: oldStatus ?? "",
            newStatus,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${appointment._id}`,
      };
    },
    dashboardNotification: async (envelope, services) => {
      const payload = envelope.payload as AppointmentStatusChangedPayload;
      const pendingAppointments =
        await services.bookingService.getPendingAppointmentsCount(new Date());
      const isCanceledByCustomer = payload.newStatus === "canceled";
      return {
        type: "appointment-status-changed",
        badges: pendingAppointmentsBadges(pendingAppointments.totalCount),
        toast:
          envelope.source.actor === "customer" && isCanceledByCustomer
            ? {
                type: "warning",
                title: {
                  key: "admin.appointments.notifications.appointmentCancelled.title" satisfies BaseAllKeys,
                },
                message: {
                  key: "admin.appointments.notifications.appointmentCancelled.message" satisfies BaseAllKeys,
                  args: {
                    name: payload.appointment.customer.name,
                    service: payload.appointment.option.name,
                  },
                },
                action: {
                  label: {
                    key: "admin.appointments.notifications.appointmentCancelled.action" satisfies BaseAllKeys,
                  },
                  href: `/dashboard/appointments/${payload.appointment._id}`,
                },
              }
            : undefined,
      };
    },
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE]: {
    type: APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppointmentSlotRescheduledPayload;
      const { appointment } = payload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.appointments.events.rescheduled.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.appointments.events.rescheduled.description" satisfies BaseAllKeys,
          args: {
            customerName: appointment.customer.name,
            serviceName: appointment.option.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${appointment._id}`,
      };
    },
    dashboardNotification: async (envelope, services) => {
      const payload = envelope.payload as AppointmentSlotRescheduledPayload;
      const pendingAppointments =
        await services.bookingService.getPendingAppointmentsCount(new Date());
      return {
        type: "appointment-rescheduled",
        badges: pendingAppointmentsBadges(pendingAppointments.totalCount),
        toast:
          envelope.source.actor === "customer"
            ? {
                type: "info",
                title: {
                  key: "admin.appointments.notifications.appointmentRescheduled.title" satisfies BaseAllKeys,
                },
                message: {
                  key: "admin.appointments.notifications.appointmentRescheduled.message" satisfies BaseAllKeys,
                  args: {
                    name: payload.appointment.customer.name,
                    service: payload.appointment.option.name,
                  },
                },
                action: {
                  label: {
                    key: "admin.appointments.notifications.appointmentRescheduled.action" satisfies BaseAllKeys,
                  },
                  href: `/dashboard/appointments/${payload.appointment._id}`,
                },
              }
            : undefined,
      };
    },
    emailNotifications: false,
    smsNotifications: false,
  },
};
