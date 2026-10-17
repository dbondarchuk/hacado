import { ITextMessageSender } from "@hacado/types";
import { TelnyxService } from "./telnyx/service";
import { TextBeltService } from "./textbelt/service";
import { getTextBeltConfiguration } from "./textbelt/utils";

export type SmsProvider = "telnyx" | "textbelt";

export const getSmsProvider = (
  value = process.env.SMS_PROVIDER,
): SmsProvider => {
  const provider = value?.trim().toLowerCase() || "telnyx";
  if (provider === "telnyx" || provider === "textbelt") {
    return provider;
  }

  throw new Error(`Unsupported SMS_PROVIDER: ${value}`);
};

export const createDefaultTextMessageSender = (): ITextMessageSender => {
  if (getSmsProvider() === "textbelt") {
    return new TextBeltService(getTextBeltConfiguration());
  }

  return new TelnyxService();
};
