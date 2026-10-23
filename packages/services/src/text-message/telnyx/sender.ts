import { getPhoneCountry } from "@hacado/utils";
import {
  getSupportedSmsCountries,
  SMS_NOT_SUPPORTED,
  TelnyxConfiguration,
} from "./config";

export type SenderResolution =
  | { from: string; messagingProfileId: string }
  | { skipped: true; reason: typeof SMS_NOT_SUPPORTED };

export const resolveSender = (
  toE164: string,
  configuration: Pick<TelnyxConfiguration, "fromNumber" | "messagingProfileId">,
  override?: { from?: string; messagingProfileId?: string },
): SenderResolution => {
  const country = getPhoneCountry(toE164)?.toUpperCase();
  if (!country || !getSupportedSmsCountries().includes(country)) {
    return { skipped: true, reason: SMS_NOT_SUPPORTED };
  }

  return {
    from: override?.from || configuration.fromNumber,
    messagingProfileId:
      override?.messagingProfileId ?? configuration.messagingProfileId,
  };
};
