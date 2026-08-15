import { PolarClientWrapper } from "./polar-client-wrapper";
import { PolarConfig } from "./types";

let polarSingleton: PolarClientWrapper | null = null;

export function getPolarConfig(): PolarConfig {
  return {
    accessToken: process.env.POLAR_ACCESS_TOKEN?.trim() ?? "",
    server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
    smsCreditsMeterId: process.env.POLAR_SMS_CREDITS_METER_ID?.trim() ?? "",
    smsUsageEventName: process.env.POLAR_SMS_USAGE_EVENT_NAME?.trim() ?? "",
  };
}

export function getPolarClient(): PolarClientWrapper {
  if (!polarSingleton) {
    polarSingleton = new PolarClientWrapper(getPolarConfig());
  }

  return polarSingleton;
}
