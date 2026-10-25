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

export type InboundSmsKeyword = "stop" | "start" | "help";

export const classifyInboundSmsKeyword = (
  value: string | null | undefined,
): InboundSmsKeyword | null => {
  const command = (value ?? "").trim().toUpperCase();
  if (!command) {
    return null;
  }

  if ((SMS_OPT_OUT_KEYWORDS as readonly string[]).includes(command)) {
    return "stop";
  }

  if ((SMS_OPT_IN_KEYWORDS as readonly string[]).includes(command)) {
    return "start";
  }

  if (command === "HELP") {
    return "help";
  }

  return null;
};

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

export const SMS_APPOINTMENT_CONSENT_BEFORE = "SMS_APPOINTMENT_CONSENT_BEFORE";

export const appointmentSkipsSmsConsent = (
  createdAt: Date | undefined,
  cutoff = process.env[SMS_APPOINTMENT_CONSENT_BEFORE],
): boolean => {
  if (!cutoff || !createdAt) {
    return false;
  }

  const parsed = new Date(cutoff);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return createdAt.getTime() < parsed.getTime();
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

const smsUrlPattern = () => /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

const stripUrl = (url: string): string => {
  const core = url.replace(/[),.;:!?]+$/u, "");
  return url.slice(core.length);
};

const TRAILING_LINK_INTRODUCER =
  /\s+(?:[\p{L}\p{N}][\p{L}\p{N}'’-]*)(?:\s+[\p{L}\p{N}][\p{L}\p{N}'’-]*){0,11}:\s*$/u;

const SMS_GREETING = /^(?:hi|hello|hey|hola|bonjour|salut|привіт)\b[,\s]*/iu;

const GREETING_NAME =
  /^[\p{L}][\p{L}'’.-]{0,40}(?:\s+[\p{L}][\p{L}'’.-]{0,40})?,?\s*/u;

export type PreparedTextbeltSmsBody =
  | { send: true; message: string }
  | { send: false; reason: string };

const hasUsefulSmsContent = (text: string): boolean => {
  let rest = text.replace(/[,\s]+$/u, "").trim();
  if (!rest) {
    return false;
  }

  rest = rest.replace(/^[^:\n]{1,80}:\s+/u, "").trim();
  const greeting = rest.match(SMS_GREETING);
  if (greeting) {
    rest = rest.slice(greeting[0].length).replace(GREETING_NAME, "").trim();
  }

  return /[\p{L}\p{N}]/u.test(rest);
};

export const prepareTextbeltSmsBody = (
  body: string,
): PreparedTextbeltSmsBody => {
  if (!/(?:https?:\/\/|www\.)/i.test(body)) {
    return { send: true, message: body };
  }

  const withoutUrls = body
    .replace(smsUrlPattern(), stripUrl)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,])/g, "$1")
    .replace(TRAILING_LINK_INTRODUCER, "")
    .trim();

  if (!hasUsefulSmsContent(withoutUrls)) {
    return { send: false, reason: "message had only a link" };
  }

  return { send: true, message: withoutUrls };
};

export const shouldSkipDuplicateSend = (
  existing: { status: string } | null | undefined,
): boolean =>
  existing?.status === "accepted" || existing?.status === "delivered";
