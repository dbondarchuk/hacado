import {
  AppointmentEventAddon,
  AppointmentEventOption,
  asOptionalField,
  Customer,
  OrganizationMember,
  Prettify,
  WithDatabaseId,
  WithEmail,
  WithOrganizationId,
  zEmail,
  zNonEmptyString,
  zObjectId,
  zPhone,
  zUniqueArray,
} from "@hacado/types";
import * as z from "zod";
import { WaitlistPublicAllKeys } from "../translations/types";

export const waitlistTime = ["morning", "afternoon", "evening"] as const;
export type WaitlistTime = (typeof waitlistTime)[number];

export const waitlistTimeSchema = z.enum(waitlistTime, {
  error:
    "app_waitlist_public.block.times.required" satisfies WaitlistPublicAllKeys,
});

export const waitlistDateSchema = z.object({
  date: z.iso.date(
    "app_waitlist_public.block.date.required" satisfies WaitlistPublicAllKeys,
  ),
  time: zUniqueArray(
    z.array(waitlistTimeSchema),
    (x) => x,
    "app_waitlist_public.block.times.required" satisfies WaitlistPublicAllKeys,
  ),
});

export type WaitlistDate = z.infer<typeof waitlistDateSchema>;

export const waitlistRequestFormSchemaBase = z.object({
  email: zEmail,
  name: zNonEmptyString(
    "app_waitlist_public.block.name.required" satisfies WaitlistPublicAllKeys,
    1,
    256,
    "app_waitlist_public.block.name.max" satisfies WaitlistPublicAllKeys,
  ),
  phone: zPhone,
  note: asOptionalField(
    z
      .string()
      .max(
        1024,
        "app_waitlist_public.block.note.max" satisfies WaitlistPublicAllKeys,
      ),
  ),
});

export const MAX_WAITLIST_DATES = 30;

export const waitlistRequestDates = zUniqueArray(
  z
    .array(waitlistDateSchema)
    .min(
      1,
      "app_waitlist_public.block.dates.required" satisfies WaitlistPublicAllKeys,
    )
    .max(
      MAX_WAITLIST_DATES,
      "app_waitlist_public.block.dates.max" satisfies WaitlistPublicAllKeys,
    ),
  (x) => x.date,
  "app_waitlist_public.block.dates.required" satisfies WaitlistPublicAllKeys,
);

export const waitlistRequestFormSchema = waitlistRequestFormSchemaBase.and(
  z
    .object({
      asSoonAsPossible: z.literal(false, {
        error:
          "app_waitlist_public.block.asSoonAsPossible.required" satisfies WaitlistPublicAllKeys,
      }),
      dates: waitlistRequestDates,
    })
    .or(
      z.object({
        asSoonAsPossible: z.literal(true, {
          error:
            "app_waitlist_public.block.asSoonAsPossible.required" satisfies WaitlistPublicAllKeys,
        }),
        dates: z.never().optional(),
      }),
    ),
);

export type WaitlistRequestForm = Prettify<
  z.infer<typeof waitlistRequestFormSchema>
>;

export const waitlistRequestSchema = waitlistRequestFormSchema.and(
  z.object({
    optionId: zObjectId("appointments.request.optionId.required"),
    memberId: zObjectId("appointments.request.memberId.required"),
    addonsIds: zUniqueArray(
      z.array(zObjectId("appointments.request.addonsIds.required")),
      (x) => x,
      "appointments.request.addonsIds.unique",
    ).optional(),
    duration: z.coerce
      .number<number>({ error: "appointments.request.duration.required" })
      .int("appointments.request.duration.positive")
      .min(1, "appointments.request.duration.positive")
      .max(60 * 24 * 1, "appointments.request.duration.max")
      .optional(),
  }),
);

export type WaitlistRequest = Prettify<z.infer<typeof waitlistRequestSchema>>;

export const waitlistStatus = ["active", "dismissed"] as const;
export type WaitlistStatus = (typeof waitlistStatus)[number];

export type WaitlistEntryEntity = WithOrganizationId<
  WithDatabaseId<WaitlistRequest>
> & {
  appId: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  status: WaitlistStatus;
};

export type WaitlistEntry = Prettify<
  WaitlistEntryEntity & {
    customer: Customer;
    member: WithEmail<OrganizationMember>;
    option: AppointmentEventOption;
    addons?: AppointmentEventAddon[];
  }
>;
