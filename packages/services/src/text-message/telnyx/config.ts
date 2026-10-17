export type TelnyxConfiguration = {
  apiKey: string;
  publicKey: string;
  fromNumber: string;
  messagingProfileId: string;
};

export const getTelnyxConfiguration = (): TelnyxConfiguration => {
  return {
    apiKey: process.env.TELNYX_API_KEY ?? "",
    publicKey: process.env.TELNYX_PUBLIC_KEY ?? "",
    fromNumber: process.env.TELNYX_FROM_NUMBER ?? "",
    messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID ?? "",
  };
};

export const getSupportedSmsCountries = (): string[] => {
  return (process.env.SMS_SUPPORTED_COUNTRIES || "US,CA")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);
};

export const SMS_NOT_SUPPORTED = "SMS not supported yet";
