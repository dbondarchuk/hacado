import { EMAIL_BRAND } from "../../brand";
import type { EmailLayoutProps } from "./schema";

export const EmailLayoutDefaultProps = {
  backdropColor: EMAIL_BRAND.cream,
  canvasColor: EMAIL_BRAND.creamLight,
  textColor: EMAIL_BRAND.ink,
  fontFamily: "MODERN_SANS",
  maxWidth: 600,
  padding: {
    top: 24,
    bottom: 24,
    left: 16,
    right: 16,
  },
  children: [],
} as const satisfies EmailLayoutProps;
