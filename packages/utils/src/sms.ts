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

export const SHARED_POOL_SMS_SUFFIX = "\nSent via Hacado";

export const appendSharedPoolSuffix = (body: string) => {
  const trimmed = body.replace(/\s+$/, "");
  if (trimmed.endsWith(SHARED_POOL_SMS_SUFFIX)) return trimmed;
  return `${trimmed}${SHARED_POOL_SMS_SUFFIX}`;
};

export const isSmsEnabled = (enabled: boolean | undefined): boolean =>
  enabled === true;
