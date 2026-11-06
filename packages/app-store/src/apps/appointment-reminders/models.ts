import { AllKeys } from "@hacado/i18n";
import { communicationChannels } from "@hacado/types/communication";
import {
  querySchema,
  WithDatabaseId,
  WithOrganizationId,
} from "@hacado/types/database";
import {
  asOptinalNumberField,
  zObjectId,
  zTaggedUnion,
} from "@hacado/types/utils";
import * as z from "zod";
import { AppointmentRemindersAdminAllKeys } from "./translations/types";

export const timeBeforeAppointmentReminderType = "timeBefore" as const;
export const atTimeAppointmentReminderType = "atTimeBefore" as const;
export const timeAfterAppointmentReminderType = "timeAfter" as const;
export const atTimeAfterAppointmentReminderType = "atTimeAfter" as const;

export const appointmentReminderTypes = [
  timeBeforeAppointmentReminderType,
  atTimeAppointmentReminderType,
  timeAfterAppointmentReminderType,
  atTimeAfterAppointmentReminderType,
] as const;

export type AppointmentReminderType = (typeof appointmentReminderTypes)[number];

export const appointmentReminderTypesEnum = z.enum(appointmentReminderTypes);

export const appointmentReminderChannelsEnum = z.enum(communicationChannels);

export const appointmentReminderTimeBeforeAfterSchema = z.object({
  type: appointmentReminderTypesEnum.extract(["timeBefore", "timeAfter"]),
  weeks: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.weeks.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        10,
        "app_appointment-reminders_admin.validation.form.weeks.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
  days: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.days.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        31,
        "app_appointment-reminders_admin.validation.form.days.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
  hours: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.hours.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        24 * 5,
        "app_appointment-reminders_admin.validation.form.hours.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
  minutes: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.minutes.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        60 * 10,
        "app_appointment-reminders_admin.validation.form.minutes.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
});

export const appointmentReminderAtTimeSchema = z.object({
  type: appointmentReminderTypesEnum.extract(["atTimeBefore", "atTimeAfter"]),
  weeks: asOptinalNumberField(
    z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.weeks.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        10,
        "app_appointment-reminders_admin.validation.form.weeks.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
  days: z.coerce
    .number<number>("validation.common.number.integer")
    .int("common.number.integer")
    .min(
      0,
      "app_appointment-reminders_admin.validation.form.days.min" satisfies AppointmentRemindersAdminAllKeys,
    )
    .max(
      31,
      "app_appointment-reminders_admin.validation.form.days.max" satisfies AppointmentRemindersAdminAllKeys,
    ),
  time: z.object({
    hour: z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.time.hour.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        23,
        "app_appointment-reminders_admin.validation.form.time.hour.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
    minute: z.coerce
      .number<number>("validation.common.number.integer")
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        0,
        "app_appointment-reminders_admin.validation.form.time.minute.min" satisfies AppointmentRemindersAdminAllKeys,
      )
      .max(
        59,
        "app_appointment-reminders_admin.validation.form.time.minute.max" satisfies AppointmentRemindersAdminAllKeys,
      ),
  }),
});

export const appointmentReminderTypeSchema = z.discriminatedUnion("type", [
  appointmentReminderTimeBeforeAfterSchema,
  appointmentReminderAtTimeSchema,
]);

const appointmentReminderTemplateRequired =
  "app_appointment-reminders_admin.validation.form.templateId.required" satisfies AppointmentRemindersAdminAllKeys;

const appointmentReminderChannelRequired =
  "app_appointment-reminders_admin.validation.form.channel.required" satisfies AppointmentRemindersAdminAllKeys;

export const appointmentReminderChannelSchema = z.object({
  emailEnabled: z.boolean().optional(),
  textEnabled: z.boolean().optional(),
  emailTemplateId: zObjectId(appointmentReminderTemplateRequired).optional(),
  textTemplateId: zObjectId().optional(),
});

export type AppointmentReminderChannelSelection = {
  emailEnabled?: boolean;
  textEnabled?: boolean;
  emailTemplateId?: string;
  textTemplateId?: string;
  channel?: "email" | "text-message" | Array<"email" | "text-message">;
  templateId?: string;
  enabled?: boolean;
  smsKind?: string;
};

export const readAppointmentReminderChannels = (
  value: AppointmentReminderChannelSelection,
): {
  emailEnabled: boolean;
  textEnabled: boolean;
  emailTemplateId?: string;
  textTemplateId?: string;
} => {
  if (
    typeof value.emailEnabled === "boolean" ||
    typeof value.textEnabled === "boolean"
  ) {
    return {
      emailEnabled: value.emailEnabled === true,
      textEnabled: value.textEnabled === true,
      emailTemplateId: value.emailTemplateId,
      textTemplateId: value.textTemplateId,
    };
  }

  const channels = Array.isArray(value.channel)
    ? value.channel
    : value.channel
      ? [value.channel]
      : [];

  const emailEnabled = channels.includes("email");
  const textEnabled =
    channels.includes("text-message") && value.enabled === true;

  return {
    emailEnabled,
    textEnabled,
    emailTemplateId: emailEnabled ? value.templateId : undefined,
    textTemplateId:
      textEnabled && value.smsKind !== "followUp"
        ? value.templateId
        : undefined,
  };
};

export const appointmentReminderAppointmentCountType = [
  "none",
  "lessThan",
  "equalTo",
  "greaterThan",
  "lessThanOrEqualTo",
  "greaterThanOrEqualTo",
] as const;

export const appointmentReminderAppointmentCountTypeEnum = z.enum(
  appointmentReminderAppointmentCountType,
  {
    error:
      "app_appointment-reminders_admin.validation.form.appointmentCount.type" satisfies AppointmentRemindersAdminAllKeys,
  },
);

export const appointmentReminderAppointmentCountSchema = z.object({
  type: appointmentReminderAppointmentCountTypeEnum,
  count: asOptinalNumberField(
    z.coerce
      .number<number>({
        error:
          "app_appointment-reminders_admin.validation.form.appointmentCount.min" satisfies AppointmentRemindersAdminAllKeys,
      })
      .int("validation.common.number.integer" satisfies AllKeys)
      .min(
        1,
        "app_appointment-reminders_admin.validation.form.appointmentCount.min" satisfies AppointmentRemindersAdminAllKeys,
      ),
  ),
});

export const appointmentReminderGeneralSchema = z.object({
  name: z
    .string(
      "app_appointment-reminders_admin.validation.form.name.min" satisfies AppointmentRemindersAdminAllKeys,
    )
    .min(
      2,
      "app_appointment-reminders_admin.validation.form.name.min" satisfies AppointmentRemindersAdminAllKeys,
    )
    .max(
      256,
      "app_appointment-reminders_admin.validation.form.name.max" satisfies AppointmentRemindersAdminAllKeys,
    ),

  // Optional setting to send appointment reminder after specific number of customer appointments
  appointmentCount: appointmentReminderAppointmentCountSchema,
});

export const appointmentReminderSchema = z
  .intersection(
    z.intersection(
      appointmentReminderGeneralSchema,
      appointmentReminderTypeSchema,
    ),
    appointmentReminderChannelSchema,
  )
  .superRefine((arg, ctx) => {
    if (arg.type === "atTimeBefore" && !arg.weeks && !arg.days) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message:
          "app_appointment-reminders_admin.validation.form.atTimeBefore.days.min" satisfies AppointmentRemindersAdminAllKeys,
      });
    } else if (arg.type === "atTimeAfter" && !arg.weeks && !arg.days) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message:
          "app_appointment-reminders_admin.validation.form.atTimeAfter.days.min" satisfies AppointmentRemindersAdminAllKeys,
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
          "app_appointment-reminders_admin.validation.form.atTimeBefore.minutes.min" satisfies AppointmentRemindersAdminAllKeys,
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
          "app_appointment-reminders_admin.validation.form.atTimeAfter.minutes.min" satisfies AppointmentRemindersAdminAllKeys,
      });
    }

    if (arg.emailEnabled !== true && arg.textEnabled !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["emailEnabled"],
        message: appointmentReminderChannelRequired,
      });
    }

    if (arg.emailEnabled === true && !arg.emailTemplateId) {
      ctx.addIssue({
        code: "custom",
        path: ["emailTemplateId"],
        message: appointmentReminderTemplateRequired,
      });
    }

    if (arg.appointmentCount.type !== "none" && !arg.appointmentCount.count) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentCount.count"],
        message:
          "app_appointment-reminders_admin.validation.form.appointmentCount.min" satisfies AppointmentRemindersAdminAllKeys,
      });
    }
  });

export const getAppointmentReminderSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string,
) => {
  return appointmentReminderSchema.superRefine(async (args, ctx) => {
    if (!args.name) return;

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

export const appointmentRemindersSchema = z
  .array(appointmentReminderSchema)
  .optional();

export type TimeBeforeAfterAppointmentReminder = z.infer<
  typeof appointmentReminderTimeBeforeAfterSchema
>;

export type AtTimeAppointmentReminder = z.infer<
  typeof appointmentReminderAtTimeSchema
>;

export type AppointmentReminderUpdateModel = z.infer<
  typeof appointmentReminderSchema
>;

export type AppointmentReminder = WithOrganizationId<
  WithDatabaseId<AppointmentReminderUpdateModel>
> & {
  appId: string;
  updatedAt: Date;
};

// Request schemas

// Get appointment reminders query schema

export const getAppointmentRemindersQuerySchema = z.object({
  query: querySchema.extend({
    channel: z.array(appointmentReminderChannelsEnum).optional(),
    type: z.array(appointmentReminderTypesEnum).optional(),
  }),
});

export type GetAppointmentRemindersAction = z.infer<
  typeof getAppointmentRemindersQuerySchema
>;

export const GetAppointmentRemindersActionType =
  "get-appointment-reminders" as const;

// Get appointment reminder action

export const getAppointmentReminderActionSchema = z.object({
  id: zObjectId(),
});

export type GetAppointmentReminderAction = z.infer<
  typeof getAppointmentReminderActionSchema
>;

export const GetAppointmentReminderActionType =
  "get-appointment-reminder" as const;

// Delete appointment reminders action

export const deleteAppointmentRemindersActionSchema = z.object({
  ids: z.array(zObjectId()),
});

export type DeleteAppointmentRemindersAction = z.infer<
  typeof deleteAppointmentRemindersActionSchema
>;

export const DeleteAppointmentRemindersActionType =
  "delete-appointment-reminders" as const;

// Create new appointment reminder action

export const createNewAppointmentReminderActionSchema = z.object({
  appointmentReminder: appointmentReminderSchema,
});

export type CreateNewAppointmentReminderAction = z.infer<
  typeof createNewAppointmentReminderActionSchema
>;

export const CreateNewAppointmentReminderActionType =
  "create-appointment-reminder" as const;

// Update appointment reminder action

export const updateAppointmentReminderActionSchema = z.object({
  id: zObjectId(),
  update: appointmentReminderSchema,
});

export type UpdateAppointmentReminderAction = z.infer<
  typeof updateAppointmentReminderActionSchema
>;

export const UpdateAppointmentReminderActionType =
  "update-appointment-reminder" as const;

// Check unique appointment reminder name action

export const checkUniqueAppointmentReminderNameActionSchema = z.object({
  id: zObjectId().optional(),
  name: z.string(),
});

export type CheckUniqueAppointmentReminderNameAction = z.infer<
  typeof checkUniqueAppointmentReminderNameActionSchema
>;

export const CheckUniqueAppointmentReminderNameActionType =
  "check-unique-name" as const;

// Get app data action

export const appointmentRemindersAppDataSchema = z.object({});

export type AppointmentRemindersAppData = z.infer<
  typeof appointmentRemindersAppDataSchema
>;

export const GetAppDataActionType = "get-app-data" as const;

// Set app data action

export const setAppDataActionSchema = z.object({
  data: appointmentRemindersAppDataSchema,
});

export type SetAppDataAction = z.infer<typeof setAppDataActionSchema>;

export const SetAppDataActionType = "set-app-data" as const;

export const requestActionSchema = zTaggedUnion([
  {
    type: GetAppointmentRemindersActionType,
    data: getAppointmentRemindersQuerySchema,
  },
  {
    type: GetAppointmentReminderActionType,
    data: getAppointmentReminderActionSchema,
  },
  {
    type: DeleteAppointmentRemindersActionType,
    data: deleteAppointmentRemindersActionSchema,
  },
  {
    type: CreateNewAppointmentReminderActionType,
    data: createNewAppointmentReminderActionSchema,
  },
  {
    type: UpdateAppointmentReminderActionType,
    data: updateAppointmentReminderActionSchema,
  },
  {
    type: CheckUniqueAppointmentReminderNameActionType,
    data: checkUniqueAppointmentReminderNameActionSchema,
  },
  { type: GetAppDataActionType },
  { type: SetAppDataActionType, data: setAppDataActionSchema },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;

export type AppointmentRemindersJobPayload =
  | {
      type: "send-appointment-reminder";
      appointmentReminderId: string;
      appointmentId: string;
    }
  | {
      type: "update-appointment-reminder";
      appointmentReminderId: string;
    }
  | {
      type: "update-appointment";
      appointmentId: string;
    }
  | {
      type: "delete-appointment-reminder";
      appointmentReminderId: string;
    }
  | {
      type: "delete-appointment-reminders";
      appointmentReminderIds: string[];
    };
