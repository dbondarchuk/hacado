import { getPhoneCountry, normalizeToE164 } from "./phone";

export const isPlatformSmsCountry = (phone: string): boolean => {
  const e164 = normalizeToE164(phone);
  if (!e164) {
    return false;
  }

  const country = getPhoneCountry(e164)?.toUpperCase();
  const supported = (process.env.SMS_SUPPORTED_COUNTRIES || "US,CA")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  return Boolean(country && supported.includes(country));
};

export const smsCustomerName = (name?: string | null): string | undefined => {
  const trimmed = name?.trim();
  return trimmed || undefined;
};

export const isSmsEnabled = (
  enabled: boolean | undefined,
  templateId: string | undefined | null,
): boolean => {
  if (typeof enabled === "boolean") {
    return enabled;
  }

  return Boolean(templateId);
};
