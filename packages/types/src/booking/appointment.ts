import { AssetEntity } from "../assets/entity";
import { Customer } from "../customers/customer";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { DateRange } from "../general";
import { OrganizationMember } from "../users/member";
import { Prettify } from "../utils/helpers";
import {
  AppointmentEvent,
  AppointmentOnlineMeetingInformation,
} from "./appointment-event";
import { CustomerPackage } from "./appointment-package";
import { Payment } from "./payment";

export const appointmentStatuses = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const closedAppointmentStatuses = [
  "declined",
  "canceled",
  "noShow",
] as const;

export type ClosedAppointmentStatus =
  (typeof closedAppointmentStatuses)[number];

export const isClosedAppointmentStatus = (
  status: AppointmentStatus,
): status is ClosedAppointmentStatus =>
  (closedAppointmentStatuses as readonly AppointmentStatus[]).includes(status);

export const openAppointmentStatusMongoFilter = {
  $nin: closedAppointmentStatuses,
} as const;

export const closedAppointmentStatusMongoFilter = {
  $in: closedAppointmentStatuses,
} as const;

export type AppointmentEntity = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      AppointmentEvent & {
        status: AppointmentStatus;
        createdAt: Date;
        customerId: string;
        /** Assigned staff member (Better Auth members._id). */
        memberId: string;
        meetingInformation?: AppointmentOnlineMeetingInformation;
      }
    >
  >
>;

export type Appointment = Prettify<
  AppointmentEntity & {
    customer: Customer;
    member: OrganizationMember;
    files?: AssetEntity[];
    payments?: Payment[];
    /** Joined from customer-packages when packageUsage is present. */
    customerPackage?: CustomerPackage;
    endAt: Date;
  }
>;

/** Appointment enriched with proximity to a list-query `referenceDate`. */
export type AppointmentWithReferenceDateDistance = Prettify<
  Appointment & {
    referenceDateDistanceMs: number;
  }
>;

export type GetAppointmentsQueryBase = {
  range?: DateRange;
  endRange?: DateRange;
  status?: AppointmentStatus[];
  optionId?: string | string[];
  customerId?: string | string[];
  discountId?: string | string[];
  memberId?: string | string[];
  /** Catalog package id(s) — matches joined customerPackage.packageId. */
  packageId?: string | string[];
  /** Specific sold (customer) package id. */
  customerPackageId?: string;
};

export type GetAppointmentsQueryWithReferenceDate = GetAppointmentsQueryBase & {
  referenceDate: Date;
};

export type GetAppointmentsQuery = GetAppointmentsQueryBase & {
  referenceDate?: Date;
};
