import type { BaseAllKeys } from "@hacado/i18n/keys";
import type { NotificationAudience } from "@hacado/types/apps";

import type {
  AppointmentCreatedPayload,
  AppointmentRescheduledPayload,
  AppointmentSlotRescheduledPayload,
  AppointmentStatusChangedPayload,
  EventDefinition,
} from "@hacado/types/events";
import {
  APPOINTMENT_CREATED_EVENT_TYPE,
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
} from "@hacado/types/events";
import { durationToTime } from "@hacado/utils/time";

import { buildAppointmentLimitReachedEmails } from "./appointment-limit-email";

type AppointmentDashboardToast = {
  type: "info" | "warning";
  title: { key: BaseAllKeys };
  message: { key: BaseAllKeys; args?: Record<string, any> };
  action?: {
    label: { key: BaseAllKeys };
    href: string;
  };
};

type AppointmentPushAction = {
  action: string;
  title: { key: BaseAllKeys };
  url: string;
};

function pushFromDashboardToast(
  toast: AppointmentDashboardToast | undefined,
  tag: string,
  audience: NotificationAudience,
  actions?: AppointmentPushAction[],
) {
  if (!toast) {
    return null;
  }

  return {
    title: toast.title,
    body: toast.message,
    url: toast.action?.href,
    tag,
    audience,
    ...(actions && actions.length > 0 ? { actions } : {}),
  };
}

function appointmentPushActions(
  appointmentId: string,
  confirmed: boolean,
): AppointmentPushAction[] {
  const decline = {
    action: "decline",
    title: {
      key: "admin.appointments.notifications.actions.decline" satisfies BaseAllKeys,
    },
    url: `/dashboard/appointments/${appointmentId}/decline`,
  } satisfies AppointmentPushAction;

  if (confirmed) {
    return [decline];
  }

  return [
    {
      action: "confirm",
      title: {
        key: "admin.appointments.notifications.actions.confirm" satisfies BaseAllKeys,
      },
      url: `/dashboard/appointments/${appointmentId}/confirm`,
    } satisfies AppointmentPushAction,
    decline,
  ];
}

function getAppointmentCreatedToast(
  payload: AppointmentCreatedPayload,
): AppointmentDashboardToast {
  const duration = durationToTime(payload.appointment.totalDuration);

  return {
    type: "info",
    title: {
      key: "admin.appointments.notifications.appointmentCreated.title" satisfies BaseAllKeys,
    },
    message: {
      key: "admin.appointments.notifications.appointmentCreated.message" satisfies BaseAllKeys,
      args: {
        name: payload.appointment.customer.name,
        service: payload.appointment.service.name,
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
  };
}

function getAppointmentRescheduledToast(
  payload: AppointmentRescheduledPayload,
): AppointmentDashboardToast {
  return {
    type: "info",
    title: {
      key: "admin.appointments.notifications.appointmentRescheduled.title" satisfies BaseAllKeys,
    },
    message: {
      key: "admin.appointments.notifications.appointmentRescheduled.message" satisfies BaseAllKeys,
      args: {
        name: payload.updatedAppointment.customer.name,
        service: payload.updatedAppointment.service.name,
      },
    },
    action: {
      label: {
        key: "admin.appointments.notifications.appointmentRescheduled.action" satisfies BaseAllKeys,
      },
      href: `/dashboard/appointments/${payload.updatedAppointment._id}`,
    },
  };
}

function getAppointmentSlotRescheduledToast(
  payload: AppointmentSlotRescheduledPayload,
): AppointmentDashboardToast {
  return {
    type: "info",
    title: {
      key: "admin.appointments.notifications.appointmentRescheduled.title" satisfies BaseAllKeys,
    },
    message: {
      key: "admin.appointments.notifications.appointmentRescheduled.message" satisfies BaseAllKeys,
      args: {
        name: payload.appointment.customer.name,
        service: payload.appointment.service.name,
      },
    },
    action: {
      label: {
        key: "admin.appointments.notifications.appointmentRescheduled.action" satisfies BaseAllKeys,
      },
      href: `/dashboard/appointments/${payload.appointment._id}`,
    },
  };
}

function getAppointmentCancelledByCustomerToast(
  payload: AppointmentStatusChangedPayload,
): AppointmentDashboardToast {
  return {
    type: "warning",
    title: {
      key: "admin.appointments.notifications.appointmentCancelled.title" satisfies BaseAllKeys,
    },
    message: {
      key: "admin.appointments.notifications.appointmentCancelled.message" satisfies BaseAllKeys,
      args: {
        name: payload.appointment.customer.name,
        service: payload.appointment.service.name,
      },
    },
    action: {
      label: {
        key: "admin.appointments.notifications.appointmentCancelled.action" satisfies BaseAllKeys,
      },
      href: `/dashboard/appointments/${payload.appointment._id}`,
    },
  };
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
            serviceName: appointment.service.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${appointment._id}`,
      };
    },
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentCreatedPayload;
      if (envelope.source.actor !== "customer") {
        return null;
      }

      return {
        type: "appointment-created",
        toast: getAppointmentCreatedToast(payload),
        audience: {
          appointmentMemberId: payload.appointment.memberId,
        },
      };
    },
    pushNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentCreatedPayload;
      if (envelope.source.actor !== "customer") {
        return null;
      }

      return pushFromDashboardToast(
        getAppointmentCreatedToast(payload),
        APPOINTMENT_CREATED_EVENT_TYPE,
        { appointmentMemberId: payload.appointment.memberId },
        appointmentPushActions(payload.appointment._id, payload.confirmed),
      );
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
            serviceName: updatedAppointment.service.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${updatedAppointment._id}`,
      };
    },
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentRescheduledPayload;
      const toast =
        envelope.source.actor === "customer"
          ? getAppointmentRescheduledToast(payload)
          : undefined;

      if (!toast) {
        return null;
      }

      return {
        type: "appointment-updated",
        toast,
        audience: {
          appointmentMemberId: payload.updatedAppointment.memberId,
        },
      };
    },
    pushNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentRescheduledPayload;
      if (envelope.source.actor !== "customer") {
        return null;
      }

      return pushFromDashboardToast(
        getAppointmentRescheduledToast(payload),
        APPOINTMENT_RESCHEDULED_EVENT_TYPE,
        { appointmentMemberId: payload.updatedAppointment.memberId },
      );
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
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentStatusChangedPayload;
      const isCanceledByCustomer = payload.newStatus === "canceled";
      const toast =
        envelope.source.actor === "customer" && isCanceledByCustomer
          ? getAppointmentCancelledByCustomerToast(payload)
          : undefined;

      if (!toast) {
        return null;
      }

      return {
        type: "appointment-status-changed",
        toast,
        audience: {
          appointmentMemberId: payload.appointment.memberId,
        },
      };
    },
    pushNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentStatusChangedPayload;
      const isCanceledByCustomer = payload.newStatus === "canceled";
      if (envelope.source.actor !== "customer" || !isCanceledByCustomer) {
        return null;
      }

      return pushFromDashboardToast(
        getAppointmentCancelledByCustomerToast(payload),
        APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
        { appointmentMemberId: payload.appointment.memberId },
      );
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
            serviceName: appointment.service.name,
          },
        },
        source: envelope.source,
        link: `/dashboard/appointments/${appointment._id}`,
      };
    },
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentSlotRescheduledPayload;
      const toast =
        envelope.source.actor === "customer"
          ? getAppointmentSlotRescheduledToast(payload)
          : undefined;

      if (!toast) {
        return null;
      }

      return {
        type: "appointment-rescheduled",
        toast,
        audience: {
          appointmentMemberId: payload.appointment.memberId,
        },
      };
    },
    pushNotification: async (envelope) => {
      const payload = envelope.payload as AppointmentSlotRescheduledPayload;
      if (envelope.source.actor !== "customer") {
        return null;
      }

      return pushFromDashboardToast(
        getAppointmentSlotRescheduledToast(payload),
        APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
        { appointmentMemberId: payload.appointment.memberId },
      );
    },
    emailNotifications: false,
    smsNotifications: false,
  },
};
