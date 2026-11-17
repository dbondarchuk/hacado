import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";
export const flowOrderSchema = z
  .enum(["service-first", "specialist-first"])
  .default("service-first")
  .optional()
  .describe(
    "Whether users pick service or specialist first in the booking steps.",
  );

export type FlowOrder = z.infer<typeof flowOrderSchema>;

export const BookingWithWaitlistPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
  props: z
    .object({
      confirmationPage: z
        .string()
        .optional()
        .nullable()
        .describe("Page slug or URL shown after a successful booking."),
      flowOrder: flowOrderSchema,
      dontAllowAnySpecialist: z
        .boolean()
        .optional()
        .describe('Disallow the "any specialist" option when choosing staff.'),
      lockServiceId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of the service to preselect and lock; users cannot change it.",
        ),
      lockMemberId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of the staff member to preselect and lock; users cannot change it.",
        ),
    })
    .describe("Block configuration props"),
});

export type BookingWithWaitlistProps = z.infer<
  typeof BookingWithWaitlistPropsSchema
>;

export type BookingWithWaitlistReaderProps = BaseReaderBlockProps<any> &
  BookingWithWaitlistProps;

export const BookingWithWaitlistPropsDefaults = {
  style: {
    display: [
      {
        value: "grid",
      },
    ],
    gridTemplateColumns: [
      {
        value: "1fr",
      },
      {
        value: "repeat(2, 1fr)",
        breakpoint: ["md"],
      },
      {
        value: "repeat(3, 1fr)",
        breakpoint: ["lg"],
      },
    ],
    alignItems: [
      {
        value: "stretch",
      },
    ],
    justifyContent: [
      {
        value: "center",
      },
    ],
    gap: [
      {
        value: {
          value: 2.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    flowOrder: "service-first",
  },
} as const satisfies BookingWithWaitlistProps;
