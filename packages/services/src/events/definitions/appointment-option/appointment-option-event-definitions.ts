import { BaseAllKeys } from "@hacado/i18n";
import {
  APPOINTMENT_OPTION_CREATED_EVENT_TYPE,
  APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
  APPOINTMENT_OPTION_UPDATED_EVENT_TYPE,
  type AppointmentOptionCreatedPayload,
  type AppointmentOptionDeletedPayload,
  type AppointmentOptionUpdatedPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";

/** Service / appointment option - previously covered by the legacy service hook. */
export const APPOINTMENT_OPTION_EVENT_DEFINITIONS: Record<
  string,
  EventDefinition
> = {
  [APPOINTMENT_OPTION_CREATED_EVENT_TYPE]: {
    type: APPOINTMENT_OPTION_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { option } = envelope.payload as AppointmentOptionCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentOption.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentOption.created.description" satisfies BaseAllKeys,
          args: { name: option.name },
        },
        source: envelope.source,
        link: dashboardUrls.option(option._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_OPTION_UPDATED_EVENT_TYPE]: {
    type: APPOINTMENT_OPTION_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { option } = envelope.payload as AppointmentOptionUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentOption.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentOption.updated.description" satisfies BaseAllKeys,
          args: { name: option.name },
        },
        source: envelope.source,
        link: dashboardUrls.option(option._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_OPTION_DELETED_EVENT_TYPE]: {
    type: APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { optionIds } = envelope.payload as AppointmentOptionDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentOption.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentOption.deleted.description" satisfies BaseAllKeys,
          args: { count: optionIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.options,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
