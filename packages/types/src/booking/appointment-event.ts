import * as z from "zod";
import {
  AppointmentReschedulePolicyAction,
  AppointmentWithDepositCancellationPolicyAction,
} from "../configuration/booking/cancellation";
import {
  zNonEmptyString,
  zObjectId,
  zOptionalOrMinLengthString,
  zPhone,
  zUniqueArray,
} from "../utils";
import { Extandable, Prettify } from "../utils/helpers";
import { zTimeZone } from "../utils/zTimeZone";
import { AppointmentAddon, AppointmentOption } from "./appointment-option";
import type { ApplyGiftCardsSuccessResponse } from "./gift-card";

export type AppointmentFields = {
  name: string;
  email: string;
  phone: string;
} & {
  [key: string]: any;
};

export type AppointmentDiscount = {
  id: string;
  name: string;
  code: string;
  discountAmount: number;
};

export type AppointmentEventOption = Prettify<
  Pick<AppointmentOption, "_id" | "name" | "durationType" | "isOnline"> & {
    duration: number;
    price?: number;
  }
>;
export type AppointmentEventAddon = Prettify<
  Pick<AppointmentAddon, "_id" | "name" | "price" | "duration">
>;

export type AppointmentOnlineMeetingInformation = {
  url: string;
  type: string;
  meetingId: string;
  meetingPassword?: string;
  data?: Record<string, any>;
};

export type AppointmentEvent = {
  totalDuration: number;
  totalPrice?: number;
  dateTime: Date;
  timeZone: string;
  fields: AppointmentFields;
  option: AppointmentEventOption;
  fieldsLabels?: Record<string, string>;
  addons?: AppointmentEventAddon[];
  note?: string;
  discount?: AppointmentDiscount;
  data?: Record<string, any>;
};

export const appointmentEventSchema = z.object({
  totalDuration: z.coerce.number<number>().int().min(1),
  totalPrice: z.coerce.number<number>().optional(),
  dateTime: z.coerce.date<Date>(),
  /** Preferred/assigned staff member; resolved server-side (owner fallback) when omitted. */
  memberId: z.string().optional(),
  fields: z.looseObject({
    email: z.email("appointments.request.fields.email.required"),
    name: zNonEmptyString("appointments.request.fields.name.required"),
    phone: zPhone,
  }),
  optionId: zNonEmptyString("appointments.request.optionId.required"),
  addonsIds: zUniqueArray(
    z.array(zNonEmptyString("appointments.request.addonsIds.required")),
    (x) => x,
    "appointments.request.addonsIds.unique",
  ).optional(),
  note: z.string().optional(),
  discount: z
    .object({
      code: zNonEmptyString("appointments.request.discount.code.required"),
      discountAmount: z.coerce.number<number>().min(1),
    })
    .optional(),
  data: z
    .record(z.string(), z.any())
    .optional()
    .nullable()
    .transform((data) => data ?? undefined),
});

export type AppointmentEventRequest = z.infer<typeof appointmentEventSchema>;

export const appointmentRequestSchema = z.object({
  optionId: zNonEmptyString("appointments.request.optionId.required"),
  /** Preferred/assigned staff member; resolved server-side (owner fallback) when omitted. */
  memberId: z.string().optional(),
  addonsIds: zUniqueArray(
    z.array(zNonEmptyString("appointments.request.addonsIds.required")),
    (x) => x,
    "appointments.request.addonsIds.unique",
  ).optional(),
  dateTime: z.coerce.date<Date>({
    error: "appointments.request.dateTime.required",
  }),
  timeZone: zTimeZone,
  duration: z.coerce
    .number<number>({ error: "appointments.request.duration.required" })
    .int("appointments.request.duration.positive")
    .min(1, "appointments.request.duration.positive")
    .max(60 * 24 * 1, "appointments.request.duration.max")
    .optional(),
  fields: z.looseObject({
    email: z.email("appointments.request.fields.email.required").trim(),
    name: zNonEmptyString("appointments.request.fields.name.required"),
    phone: zPhone,
  }),
  promoCode: zOptionalOrMinLengthString(
    1,
    "appointments.request.promoCode.min",
  ),
  giftCards: zUniqueArray(
    z
      .array(
        zNonEmptyString("appointments.request.giftCards.required").min(
          1,
          "appointments.request.giftCards.min",
        ),
      )
      .max(2, "appointments.request.giftCards.max"),
    (x) => x,
    "appointments.request.giftCards.unique",
  ).optional(),
  paymentIntentId: zOptionalOrMinLengthString(
    1,
    "appointments.request.paymentIntentId.min",
  ),
});

export type AppointmentRequest = z.infer<typeof appointmentRequestSchema>;

export class AppointmentTimeNotAvaialbleError extends Error {}

export const modifyAppointmentType = ["cancel", "reschedule"] as const;
export type ModifyAppointmentType = (typeof modifyAppointmentType)[number];
export const modifyAppointmentTypeSchema = z.enum(modifyAppointmentType);

export const modifyAppointmentInformationRequestSchema = z.discriminatedUnion(
  "lookup",
  [
    z.object({
      lookup: z.literal("appointmentId"),
      type: modifyAppointmentTypeSchema,
      appointmentId: zObjectId("appointments.request.appointmentId.required"),
    }),
    z.object({
      lookup: z.literal("dateTime"),
      type: modifyAppointmentTypeSchema,
      dateTime: z.coerce.date<Date>({
        error: "appointments.request.dateTime.required",
      }),
    }),
  ],
);

export type ModifyAppointmentInformationRequest = z.infer<
  typeof modifyAppointmentInformationRequestSchema
>;

const modifyAppointmentRequestGiftCardsSchema = zUniqueArray(
  z
    .array(
      zNonEmptyString("appointments.request.giftCards.required").min(
        1,
        "appointments.request.giftCards.min",
      ),
    )
    .max(2, "appointments.request.giftCards.max"),
  (x) => x,
  "appointments.request.giftCards.unique",
).optional();

export const modifyAppointmentRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: modifyAppointmentTypeSchema.extract(["cancel"]),
    paymentIntentId: zOptionalOrMinLengthString(
      1,
      "appointments.request.intentId.min",
    ),
    giftCards: modifyAppointmentRequestGiftCardsSchema,
  }),
  z.object({
    type: modifyAppointmentTypeSchema.extract(["reschedule"]),
    dateTime: z.coerce.date<Date>({
      error: "appointments.request.dateTime.required",
    }),
    paymentIntentId: zOptionalOrMinLengthString(
      1,
      "appointments.request.intentId.min",
    ),
    giftCards: modifyAppointmentRequestGiftCardsSchema,
  }),
]);

export type ModifyAppointmentRequest = z.infer<
  typeof modifyAppointmentRequestSchema
>;

export const MAX_RESCHEDULES_REACHED_REASON = "max_reschedules_reached";
export const ORIGINAL_APPOINTMENT_DEPOSIT_REQUIRED_REASON =
  "original_appointment_deposit_required";
export const TIME_NOT_AVAILABLE_REASON = "time_not_available";
export const INVALID_REQUEST_TYPE_REASON = "invalid_request_type";
export const CANCELLATION_NOT_ALLOWED_REASON = "cancellation_not_allowed";
export const RESCHEDULE_NOT_ALLOWED_REASON = "reschedule_not_allowed";
export const CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON =
  "cancellation_not_allowed_by_policy";
export const RESCHEDULE_NOT_ALLOWED_BY_POLICY_REASON =
  "reschedule_not_allowed_by_policy";
export const RESCHEDULED_APPOINTMENT_NOT_ALLOWED_REASON =
  "rescheduled_appointment_not_allowed";

export type ModifyAppointmentReason = Extandable<
  | typeof MAX_RESCHEDULES_REACHED_REASON
  | typeof ORIGINAL_APPOINTMENT_DEPOSIT_REQUIRED_REASON
  | typeof TIME_NOT_AVAILABLE_REASON
  | typeof INVALID_REQUEST_TYPE_REASON
  | typeof CANCELLATION_NOT_ALLOWED_REASON
  | typeof RESCHEDULE_NOT_ALLOWED_REASON
  | typeof CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON
  | typeof RESCHEDULE_NOT_ALLOWED_BY_POLICY_REASON
  | typeof RESCHEDULED_APPOINTMENT_NOT_ALLOWED_REASON
>;

export type ModifyAppointmentInformation = {
  id: string;
  name: string;
  optionName: string;
  addonsNames?: string[];
  dateTime: Date;
  timeZone: string;
  duration: number;
  price?: number;
} & (
  | ({
      allowed: true;
      type: "cancel";
    } & (
      | {
          action: "payment";
          paymentPolicy: Extract<
            AppointmentWithDepositCancellationPolicyAction,
            "paymentRequired" | "paymentToFullPriceRequired"
          >;
          paymentAmount: number;
          giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
        }
      | {
          action: "refund";
          refundPolicy: Extract<
            AppointmentWithDepositCancellationPolicyAction,
            "partialRefund" | "fullRefund" | "forfeitDeposit"
          >;
          refundPercentage: number;
          refundAmount: number;
          refundFees: boolean;
          feesAmount: number;
        }
      | {
          action: "forfeitDeposit";
        }
      | {
          action: "allowed";
        }
    ))
  | ({
      allowed: true;
      type: "reschedule";
      timeZone: string;
    } & (
      | {
          action: Extract<AppointmentReschedulePolicyAction, "allowed">;
        }
      | {
          action: Extract<AppointmentReschedulePolicyAction, "paymentRequired">;
          paymentAmount: number;
          giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
        }
    ))
  | {
      type: ModifyAppointmentType;
      allowed: false;
      reason: ModifyAppointmentReason;
    }
);

export type CheckDuplicateAppointmentsResponse = {
  hasDuplicateAppointments: boolean;
  closestAppointment?: Date;
  doNotAllowScheduling: boolean;
};
