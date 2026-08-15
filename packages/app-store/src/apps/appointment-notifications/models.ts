import { AllKeys } from "@hacado/i18n";
import {
  asOptinalNumberField,
  communicationChannels,
  querySchema,
  WithDatabaseId,
  WithOrganizationId,
  zObjectId,
  zTaggedUnion,
} from "@hacado/types";
import * as z from "zod";
import { AppointmentNotificationsAdminAllKeys } from "./translations/types";

export const timeBeforeAppointmentNotificationType = "timeBefore" as const;
export const atTimeAppointmentNotificationType = "atTimeBefore" as const;
export const timeAfterAppointmentNotificationType = "timeAfter" as const;
export const atTimeAfterAppointmentNotificationType = "atTimeAfter" as const;

export const appointmentNotificationTypes = [
  timeBeforeAppointmentNotificationType,
  atTimeAppointmentNotificationType,
  timeAfterAppointmentNotificationType,
  atTimeAfterAppointmentNotificationType,
] as const;

export type AppointmentNotificationType =
  (typeof appointmentNotificationTypes)[number];

export const appointmentNotificationTypesEnum = z.enum(
  appointmentNotificationTypes,
);
export const appointmentNotificationChannelsEnum = z.enum(
  communicationChannels,
);

export const appointmentNotificationTimeBeforeAfterSchema = z.object({
  type: appointmentNotificationTypesEnum.extract(["timeBefore", "timeAfter"]),
  weeks: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.weeks.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        10,
        "app_appointment-notifications_admin.validation.form.weeks.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
  days: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.days.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        31,
        "app_appointment-notifications_admin.validation.form.days.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
  hours: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.hours.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        24 * 5,
        "app_appointment-notifications_admin.validation.form.hours.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
  minutes: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.minutes.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        60 * 10,
        "app_appointment-notifications_admin.validation.form.minutes.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
});

export const appointmentNotificationAtTimeSchema = z.object({
  type: appointmentNotificationTypesEnum.extract([
    "atTimeBefore",
    "atTimeAfter",
  ]),
  weeks: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.weeks.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        10,
        "app_appointment-notifications_admin.validation.form.weeks.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
  days: z.coerce
    .number<number>("validation.common.number.integer")
    .int("common.number.integer")
    .min(
      0,
      "app_appointment-notifications_admin.validation.form.days.min" satisfies AppointmentNotificationsAdminAllKeys,
    )
    .max(
      31,
      "app_appointment-notifications_admin.validation.form.days.max" satisfies AppointmentNotificationsAdminAllKeys,
    ),
  time: z.object({
    hour: z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.time.hour.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        23,
        "app_appointment-notifications_admin.validation.form.time.hour.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
    minute: z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-notifications_admin.validation.form.time.minute.min" satisfies AppointmentNotificationsAdminAllKeys,
      )
      .max(
        59,
        "app_appointment-notifications_admin.validation.form.time.minute.max" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  }),
});

export const appointmentNotificationTypeSchema = z.discriminatedUnion("type", [
  appointmentNotificationTimeBeforeAfterSchema,
  appointmentNotificationAtTimeSchema,
]);

export const appointmentNotificationChannelSchema = z.object({
  channel: appointmentNotificationChannelsEnum,
  templateId: zObjectId(
    "app_appointment-notifications_admin.validation.form.templateId.required" satisfies AppointmentNotificationsAdminAllKeys,
  ),
});

export const appointmentNotificationAppointmentCountType = [
  "none",
  "lessThan",
  "equalTo",
  "greaterThan",
  "lessThanOrEqualTo",
  "greaterThanOrEqualTo",
] as const;
export const appointmentNotificationAppointmentCountTypeEnum = z.enum(
  appointmentNotificationAppointmentCountType,
  {
    error:
      "app_appointment-notifications_admin.validation.form.appointmentCount.type" satisfies AppointmentNotificationsAdminAllKeys,
  },
);

export const appointmentNotificationAppointmentCountSchema = z.object({
  type: appointmentNotificationAppointmentCountTypeEnum,
  count: asOptinalNumberField(
    z.coerce
      .number<number>({
        error:
          "app_appointment-notifications_admin.validation.form.appointmentCount.min" satisfies AppointmentNotificationsAdminAllKeys,
      })
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        1,
        "app_appointment-notifications_admin.validation.form.appointmentCount.min" satisfies AppointmentNotificationsAdminAllKeys,
      ),
  ),
});

export const appointmentNotificationGeneralSchema = z.object({
  name: z
    .string(
      "app_appointment-notifications_admin.validation.form.name.min" satisfies AppointmentNotificationsAdminAllKeys,
    )
    .min(
      2,
      "app_appointment-notifications_admin.validation.form.name.min" satisfies AppointmentNotificationsAdminAllKeys,
    )
    .max(
      256,
      "app_appointment-notifications_admin.validation.form.name.max" satisfies AppointmentNotificationsAdminAllKeys,
    ),

  // Optional setting to send appointment notification after specific number of customer appointments
  appointmentCount: appointmentNotificationAppointmentCountSchema,
});

export const appointmentNotificationSchema = z
  .intersection(
    z.intersection(
      appointmentNotificationGeneralSchema,
      appointmentNotificationTypeSchema,
    ),
    appointmentNotificationChannelSchema,
  )
  .superRefine((arg, ctx) => {
    if (arg.type === "atTimeBefore" && !arg.weeks && !arg.days) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message:
          "app_appointment-notifications_admin.validation.form.atTimeBefore.days.min" satisfies AppointmentNotificationsAdminAllKeys,
      });
    } else if (arg.type === "atTimeAfter" && !arg.weeks && !arg.days) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message:
          "app_appointment-notifications_admin.validation.form.atTimeAfter.days.min" satisfies AppointmentNotificationsAdminAllKeys,
      });
    } else if (
      arg.type === "timeBefore" &&
      !arg.weeks &&
      !arg.days &&
      !arg.hours &&
      !arg.minutes
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minutes"],
        message:
          "app_appointment-notifications_admin.validation.form.atTimeBefore.minutes.min" satisfies AppointmentNotificationsAdminAllKeys,
      });
    } else if (
      arg.type === "timeAfter" &&
      !arg.weeks &&
      !arg.days &&
      !arg.hours &&
      !arg.minutes
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minutes"],
        message:
          "app_appointment-notifications_admin.validation.form.atTimeAfter.minutes.min" satisfies AppointmentNotificationsAdminAllKeys,
      });
    }

    if (arg.appointmentCount.type !== "none" && !arg.appointmentCount.count) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentCount.count"],
        message:
          "app_appointment-notifications_admin.validation.form.appointmentCount.min" satisfies AppointmentNotificationsAdminAllKeys,
      });
    }
  });

export const getAppointmentNotificationSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string,
) => {
  return appointmentNotificationSchema.superRefine(async (args, ctx) => {
    const isUnique = await uniqueNameCheckFn(args.name);
    if (!isUnique) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message,
      });
    }
  });
};

export const appointmentNotificationsSchema = z
  .array(appointmentNotificationSchema)
  .optional();

export type TimeBeforeAfterAppointmentNotification = z.infer<
  typeof appointmentNotificationTimeBeforeAfterSchema
>;
export type AtTimeAppointmentNotification = z.infer<
  typeof appointmentNotificationAtTimeSchema
>;

export type AppointmentNotificationUpdateModel = z.infer<
  typeof appointmentNotificationSchema
>;

export type AppointmentNotification = WithOrganizationId<
  WithDatabaseId<AppointmentNotificationUpdateModel>
> & {
  appId: string;
  updatedAt: Date;
};

// Request schemas

// Get appointment notifications query schema

export const getAppointmentNotificationsQuerySchema = z.object({
  query: querySchema.extend({
    channel: z.array(appointmentNotificationChannelsEnum).optional(),
    type: z.array(appointmentNotificationTypesEnum).optional(),
  }),
});

export type GetAppointmentNotificationsAction = z.infer<
  typeof getAppointmentNotificationsQuerySchema
>;
export const GetAppointmentNotificationsActionType =
  "get-appointment-notifications" as const;

// Get appointment notification action

export const getAppointmentNotificationActionSchema = z.object({
  id: zObjectId(),
});

export type GetAppointmentNotificationAction = z.infer<
  typeof getAppointmentNotificationActionSchema
>;
export const GetAppointmentNotificationActionType =
  "get-appointment-notification" as const;

// Delete appointment notifications action

export const deleteAppointmentNotificationsActionSchema = z.object({
  ids: z.array(zObjectId()),
});

export type DeleteAppointmentNotificationsAction = z.infer<
  typeof deleteAppointmentNotificationsActionSchema
>;
export const DeleteAppointmentNotificationsActionType =
  "delete-appointment-notifications" as const;

// Create new appointment notification action

export const createNewAppointmentNotificationActionSchema = z.object({
  appointmentNotification: appointmentNotificationSchema,
});

export type CreateNewAppointmentNotificationAction = z.infer<
  typeof createNewAppointmentNotificationActionSchema
>;
export const CreateNewAppointmentNotificationActionType =
  "create-appointment-notification" as const;

// Update appointment notification action

export const updateAppointmentNotificationActionSchema = z.object({
  id: zObjectId(),
  update: appointmentNotificationSchema,
});

export type UpdateAppointmentNotificationAction = z.infer<
  typeof updateAppointmentNotificationActionSchema
>;

export const UpdateAppointmentNotificationActionType =
  "update-appointment-notification" as const;

// Check unique appointment notification name action

export const checkUniqueAppointmentNotificationNameActionSchema = z.object({
  id: zObjectId().optional(),
  name: z.string(),
});

export type CheckUniqueAppointmentNotificationNameAction = z.infer<
  typeof checkUniqueAppointmentNotificationNameActionSchema
>;

export const CheckUniqueAppointmentNotificationNameActionType =
  "check-unique-name" as const;

// Get app data action

export const appointmentNotificationsAppDataSchema = z.object({});

export type AppointmentNotificationsAppData = z.infer<
  typeof appointmentNotificationsAppDataSchema
>;

export const GetAppDataActionType = "get-app-data" as const;

// Set app data action

export const setAppDataActionSchema = z.object({
  data: appointmentNotificationsAppDataSchema,
});

export type SetAppDataAction = z.infer<typeof setAppDataActionSchema>;

export const SetAppDataActionType = "set-app-data" as const;

export const requestActionSchema = zTaggedUnion([
  {
    type: GetAppointmentNotificationsActionType,
    data: getAppointmentNotificationsQuerySchema,
  },
  {
    type: GetAppointmentNotificationActionType,
    data: getAppointmentNotificationActionSchema,
  },
  {
    type: DeleteAppointmentNotificationsActionType,
    data: deleteAppointmentNotificationsActionSchema,
  },
  {
    type: CreateNewAppointmentNotificationActionType,
    data: createNewAppointmentNotificationActionSchema,
  },
  {
    type: UpdateAppointmentNotificationActionType,
    data: updateAppointmentNotificationActionSchema,
  },
  {
    type: CheckUniqueAppointmentNotificationNameActionType,
    data: checkUniqueAppointmentNotificationNameActionSchema,
  },
  { type: GetAppDataActionType },
  { type: SetAppDataActionType, data: setAppDataActionSchema },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;

export type AppointmentNotificationsJobPayload =
  | {
      type: "send-appointment-notification";
      appointmentNotificationId: string;
      appointmentId: string;
    }
  | {
      type: "update-appointment-notification";
      appointmentNotificationId: string;
    }
  | {
      type: "update-appointment";
      appointmentId: string;
    }
  | {
      type: "delete-appointment-notification";
      appointmentNotificationId: string;
    }
  | {
      type: "delete-appointment-notifications";
      appointmentNotificationIds: string[];
    };
