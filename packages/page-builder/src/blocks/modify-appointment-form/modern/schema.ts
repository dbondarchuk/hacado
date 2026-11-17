import { BaseReaderBlockProps } from "@hacado/builder/reader";
import * as z from "zod";
import { zStyles } from "./styles";

export const ModifyAppointmentFormPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      hideTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the modify-appointment block title"),
      hideSteps: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide step indicators in the modify flow"),
      scrollToTop: z
        .boolean()
        .optional()
        .nullable()
        .describe("Scroll to top when moving between modify steps"),
    })
    .describe("Block configuration props"),
});

export type ModifyAppointmentFormProps = z.infer<
  typeof ModifyAppointmentFormPropsSchema
>;

export type ModifyAppointmentFormReaderProps = BaseReaderBlockProps<any> &
  ModifyAppointmentFormProps;

export const ModifyAppointmentFormPropsDefaults = {
  style: {},
  props: {
    hideTitle: false,
    hideSteps: false,
    scrollToTop: true,
  },
} as const satisfies ModifyAppointmentFormProps;