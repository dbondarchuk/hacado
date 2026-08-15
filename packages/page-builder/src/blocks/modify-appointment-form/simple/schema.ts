import { BaseReaderBlockProps } from "@hacado/builder";
import * as z from "zod";
import { zStyles } from "./styles";

export const ModifyAppointmentFormPropsSchema = z.object({
  style: zStyles,
  props: z.object({}),
});

export type ModifyAppointmentFormProps = z.infer<
  typeof ModifyAppointmentFormPropsSchema
>;
export type ModifyAppointmentFormReaderProps = BaseReaderBlockProps<any> &
  ModifyAppointmentFormProps;

export const ModifyAppointmentFormPropsDefaults = {
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
  props: {},
} as const satisfies ModifyAppointmentFormProps;
