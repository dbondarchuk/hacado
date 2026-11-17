import { EMAIL_BRAND } from "../../brand";
import type { ButtonProps } from "./schema";

export const ButtonPropsDefaults = {
  props: {
    text: "Button",
    url: "https://hacado.com",
    width: "auto",
    size: "medium",
    buttonStyle: "rounded",
    buttonTextColor: EMAIL_BRAND.onPrimary,
    buttonBackgroundColor: EMAIL_BRAND.primary,
  },
  style: {
    padding: { top: 16, bottom: 16, left: 24, right: 24 },
    fontWeight: "normal",
    fontSize: 16,
    textAlign: "center",
  },
} as const satisfies ButtonProps;
