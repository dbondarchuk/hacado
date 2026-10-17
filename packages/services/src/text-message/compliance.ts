export const SMS_RATES_SENTENCE =
  "Msg&data rates may apply. Reply STOP to cancel, HELP for help.";

export const SMS_STOP_FOOTER = "Txt STOP to unsubscribe";

export const SMS_CONSENT_TEXT_VERSION = "2026-10-17";

export const SMS_OPT_OUT_KEYWORDS = [
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
] as const;

export const SMS_OPT_IN_KEYWORDS = [
  "START",
  "UNSTOP",
  "YES",
  "SUBSCRIBE",
] as const;

export { isSmsEnabled } from "@hacado/utils";

export const shouldRecordOwnerAttestation = (checked: boolean): boolean =>
  checked;

export const latestConsentAllowsSms = (
  records: { consented: boolean; createdAt: Date }[],
): boolean => {
  if (records.length === 0) {
    return false;
  }

  const latest = [...records].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];

  return latest?.consented === true;
};

export const canSendCustomerSms = (input: {
  requireConsent: boolean;
  latestConsent: boolean;
  optedOut: boolean;
}): { ok: true } | { ok: false; reason: string } => {
  if (input.optedOut) {
    return { ok: false, reason: "opted out" };
  }

  if (input.requireConsent && !input.latestConsent) {
    return { ok: false, reason: "no consent" };
  }

  return { ok: true };
};

export const appendRatesSentence = (body: string): string => {
  if (body.includes(SMS_RATES_SENTENCE)) {
    return body;
  }

  return `${body.trimEnd()}\n${SMS_RATES_SENTENCE}`;
};

export const appendStopFooter = (body: string): string => {
  if (body.trimEnd().endsWith(SMS_STOP_FOOTER)) {
    return body;
  }

  return `${body.trimEnd()}\n${SMS_STOP_FOOTER}`;
};

export const shouldSkipDuplicateSend = (
  existing: { status: string } | null | undefined,
): boolean =>
  existing?.status === "accepted" || existing?.status === "delivered";
