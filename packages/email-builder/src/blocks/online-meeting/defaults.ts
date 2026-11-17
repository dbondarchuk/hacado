import { EMAIL_BRAND } from "../../brand";
import type { OnlineMeetingProps } from "./schema";

export const OnlineMeetingPropsDefaults = {
  props: {
    title: "{{service.name}}",
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
