import { BaseAllKeys } from "@hacado/i18n";
import {
  APPOINTMENT_PACKAGE_CREATED_EVENT_TYPE,
  APPOINTMENT_PACKAGE_DELETED_EVENT_TYPE,
  APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE,
  CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE,
  CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
  CUSTOMER_PACKAGE_REDEEMED_EVENT_TYPE,
  CUSTOMER_PACKAGE_RESTORED_EVENT_TYPE,
  type AppointmentPackageCreatedPayload,
  type AppointmentPackageDeletedPayload,
  type AppointmentPackageUpdatedPayload,
  type CustomerPackageAdjustedPayload,
  type CustomerPackageCancelledPayload,
  type CustomerPackageExhaustedPayload,
  type CustomerPackageExpiredPayload,
  type CustomerPackageIssuedPayload,
  type CustomerPackageRedeemedPayload,
  type CustomerPackageRestoredPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";
import { buildCustomerPackagePurchasedOwnerEmails } from "./package-purchased-owner-email";

export const PACKAGE_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [APPOINTMENT_PACKAGE_CREATED_EVENT_TYPE]: {
    type: APPOINTMENT_PACKAGE_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { package: pkg } =
        envelope.payload as AppointmentPackageCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentPackage.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentPackage.created.description" satisfies BaseAllKeys,
          args: { name: pkg.name },
        },
        source: envelope.source,
        link: dashboardUrls.appointmentPackage(pkg._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE]: {
    type: APPOINTMENT_PACKAGE_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { package: pkg } =
        envelope.payload as AppointmentPackageUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentPackage.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentPackage.updated.description" satisfies BaseAllKeys,
          args: { name: pkg.name },
        },
        source: envelope.source,
        link: dashboardUrls.appointmentPackage(pkg._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APPOINTMENT_PACKAGE_DELETED_EVENT_TYPE]: {
    type: APPOINTMENT_PACKAGE_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { packageIds } =
        envelope.payload as AppointmentPackageDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.appointmentPackage.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.appointmentPackage.deleted.description" satisfies BaseAllKeys,
          args: { count: packageIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.appointmentPackages,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageIssuedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.issued.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.issued.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customerPackage.customerId),
      };
    },
    dashboardNotification: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageIssuedPayload;
      return {
        type: "customer-package-issued",
        toast: {
          type: "info",
          title: {
            key: "admin.services.packages.notifications.issued.title" satisfies BaseAllKeys,
          },
          message: {
            key: "admin.services.packages.notifications.issued.message" satisfies BaseAllKeys,
            args: { name: customerPackage.name },
          },
          action: {
            label: {
              key: "admin.services.packages.notifications.issued.action" satisfies BaseAllKeys,
            },
            href: dashboardUrls.customer(customerPackage.customerId),
          },
        },
      };
    },
    emailNotifications: buildCustomerPackagePurchasedOwnerEmails,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_REDEEMED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_REDEEMED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage, appointmentId } =
        envelope.payload as CustomerPackageRedeemedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.redeemed.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.redeemed.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.appointment(appointmentId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_RESTORED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_RESTORED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage, appointmentId } =
        envelope.payload as CustomerPackageRestoredPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.restored.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.restored.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.appointment(appointmentId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageAdjustedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.adjusted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.adjusted.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customerPackage.customerId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageExhaustedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.exhausted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.exhausted.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customerPackage.customerId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageCancelledPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.cancelled.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.cancelled.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customerPackage.customerId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE]: {
    type: CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customerPackage } =
        envelope.payload as CustomerPackageExpiredPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customerPackage.expired.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customerPackage.expired.description" satisfies BaseAllKeys,
          args: { name: customerPackage.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customerPackage.customerId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
