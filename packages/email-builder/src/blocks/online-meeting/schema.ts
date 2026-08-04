import * as z from "zod";
import { EMAIL_BRAND } from "../../brand";
import {
  zColorNullable,
  zFontFamily,
  zPadding,
} from "../../style-inputs/helpers/zod";

export const OnlineMeetingPropsSchema = z.object({
  props: z
    .object({
      title: z.string().optional().nullable(),
      whenText: z.string().optional().nullable(),
      codeText: z.string().optional().nullable(),
      passwordText: z.string().optional().nullable(),
      buttonText: z.string().optional().nullable(),
      linkText: z.string().optional().nullable(),
      buttonTextColor: zColorNullable,
      buttonBackgroundColor: zColorNullable,
      type: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: z.object({
    color: zColorNullable,
    backgroundColor: zColorNullable,
    fontFamily: zFontFamily.optional().nullable(),
    padding: zPadding.optional().nullable(),
  }),
});

export type OnlineMeetingProps = z.infer<typeof OnlineMeetingPropsSchema>;

export const OnlineMeetingPropsDefaults = {
  props: {
    title: "{{option.name}}",
    whenText: "When:",
    codeText: "Code:",
    passwordText: "Password:",
    buttonText: "Join Meeting",
    linkText: "Trouble joining? Copy & paste this link into your browser:",
    buttonTextColor: EMAIL_BRAND.onPrimary,
    buttonBackgroundColor: EMAIL_BRAND.primary,
    type: "{{meetingInformation.type}}",
    logoUrl: "",
  },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
  },
} as const satisfies OnlineMeetingProps;
