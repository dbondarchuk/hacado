import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const flowOrderSchema = z
  .enum(["service-first", "specialist-first"])
  .default("service-first")
  .optional()
  .describe("Whether the guest picks a service or a specialist first");

export type FlowOrder = z.infer<typeof flowOrderSchema>;

export const BookingPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      confirmationPage: z
        .string()
        .optional()
        .nullable()
        .describe("Page slug or URL to open after a successful booking"),
      flowOrder: flowOrderSchema,
      dontAllowAnySpecialist: z
        .boolean()
        .optional()
        .describe('When true, hide the "any available specialist" option'),
      lockServiceId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of a service; locks the flow so guests cannot change the selected service",
        ),
      lockMemberId: zObjectId()
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of a staff member; locks the flow so guests cannot change the selected specialist",
        ),
    })
    .describe("Block configuration props"),
});

export type BookingProps = z.infer<typeof BookingPropsSchema>;
export type BookingReaderProps = BaseReaderBlockProps<any> & BookingProps;

export const BookingPropsDefaults = {
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
} as const satisfies BookingProps;