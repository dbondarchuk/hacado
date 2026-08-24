import { getI18nAsync } from "@hacado/i18n/server";
import { getRedisClient, SystemServicesContainer } from "@hacado/services";
import { randomInt } from "node:crypto";
import {
  isMemberPhoneAvailable,
  normalizeMemberPhone,
  type MemberPhoneUniquenessContext,
} from "./member-phone-uniqueness";

export const MEMBER_PHONE_OTP_LENGTH = 6;
export const MEMBER_PHONE_OTP_TTL_SECONDS = 300;
export const MEMBER_PHONE_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const MEMBER_PHONE_OTP_MAX_REQUESTS = 5;
export const MEMBER_PHONE_VERIFIED_PROOF_TTL_SECONDS = 15 * 60;

type OtpState = {
  code: string;
  attempts: number;
  requestedAt: number;
};

export type MemberPhoneOtpContext = MemberPhoneUniquenessContext & {
  kind: "signup" | "complete-profile" | "profile-change";
  /** Redis proof key scope: userId, or signup:{phone} for pre-account signup */
  userKey: string;
  language?: "en" | "uk";
};

export type MemberPhoneOtpErrorCode =
  | "phone_in_use"
  | "rate_limited"
  | "cooldown"
  | "invalid_code"
  | "expired"
  | "too_many_attempts"
  | "sms_failed"
  | "not_verified"
  | "invalid_phone";

export class MemberPhoneOtpError extends Error {
  constructor(public readonly code: MemberPhoneOtpErrorCode) {
    super(code);
    this.name = "MemberPhoneOtpError";
  }
}

function otpKey(phone: string) {
  return `member-phone-otp:${phone}`;
}

function rateKey(phone: string) {
  return `member-phone-otp-rate:${phone}`;
}

function verifiedKey(userKey: string, phone: string) {
  return `member-phone-verified:${userKey}:${phone}`;
}

function generateCode(): string {
  const max = 10 ** MEMBER_PHONE_OTP_LENGTH;
  return String(randomInt(0, max)).padStart(MEMBER_PHONE_OTP_LENGTH, "0");
}

async function localizedSmsBody(
  otp: string,
  language: "en" | "uk" = "en",
): Promise<string> {
  try {
    const t = await getI18nAsync({ locale: language, namespace: "admin" });
    return t("auth.phoneOtp.smsBody", { otp });
  } catch {
    return `Your Hacado verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;
  }
}

export async function requestMemberPhoneOtp(
  phone: string,
  context: MemberPhoneOtpContext,
): Promise<{ ok: true; cooldownSeconds: number }> {
  const normalized = normalizeMemberPhone(phone);
  if (!normalized) {
    throw new MemberPhoneOtpError("invalid_phone");
  }

  const available = await isMemberPhoneAvailable(normalized, context);
  if (!available) {
    throw new MemberPhoneOtpError("phone_in_use");
  }

  const redis = getRedisClient();
  await redis.connect().catch(() => undefined);

  const existingRaw = await redis.get(otpKey(normalized));
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as OtpState;
      const elapsed = (Date.now() - existing.requestedAt) / 1000;
      if (elapsed < MEMBER_PHONE_OTP_RESEND_COOLDOWN_SECONDS) {
        throw new MemberPhoneOtpError("cooldown");
      }
    } catch (e) {
      if (e instanceof MemberPhoneOtpError) throw e;
    }
  }

  const rateCount = await redis.incr(rateKey(normalized));
  if (rateCount === 1) {
    await redis.expire(rateKey(normalized), MEMBER_PHONE_OTP_TTL_SECONDS);
  }
  if (rateCount > MEMBER_PHONE_OTP_MAX_REQUESTS) {
    throw new MemberPhoneOtpError("rate_limited");
  }

  const code = generateCode();
  const state: OtpState = {
    code,
    attempts: 0,
    requestedAt: Date.now(),
  };

  await redis.set(
    otpKey(normalized),
    JSON.stringify(state),
    "EX",
    MEMBER_PHONE_OTP_TTL_SECONDS,
  );

  try {
    const { notificationService } = SystemServicesContainer();
    await notificationService.sendSystemTextMessage({
      phone: normalized,
      message: await localizedSmsBody(code, context.language ?? "en"),
    });
  } catch {
    await redis.del(otpKey(normalized));
    throw new MemberPhoneOtpError("sms_failed");
  }

  return {
    ok: true,
    cooldownSeconds: MEMBER_PHONE_OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function verifyMemberPhoneOtp(
  phone: string,
  code: string,
  context: MemberPhoneOtpContext,
): Promise<{ ok: true }> {
  const normalized = normalizeMemberPhone(phone);
  const otp = code.trim();
  if (!normalized || !otp) {
    throw new MemberPhoneOtpError("invalid_code");
  }

  const available = await isMemberPhoneAvailable(normalized, context);
  if (!available) {
    throw new MemberPhoneOtpError("phone_in_use");
  }

  const redis = getRedisClient();
  await redis.connect().catch(() => undefined);

  const raw = await redis.get(otpKey(normalized));
  if (!raw) {
    throw new MemberPhoneOtpError("expired");
  }

  let state: OtpState;
  try {
    state = JSON.parse(raw) as OtpState;
  } catch {
    throw new MemberPhoneOtpError("expired");
  }

  if (state.attempts >= 5) {
    await redis.del(otpKey(normalized));
    throw new MemberPhoneOtpError("too_many_attempts");
  }

  if (state.code !== otp) {
    state.attempts += 1;
    const ttl = await redis.ttl(otpKey(normalized));
    await redis.set(
      otpKey(normalized),
      JSON.stringify(state),
      "EX",
      ttl > 0 ? ttl : MEMBER_PHONE_OTP_TTL_SECONDS,
    );
    throw new MemberPhoneOtpError("invalid_code");
  }

  await redis.del(otpKey(normalized));
  await redis.set(
    verifiedKey(context.userKey, normalized),
    "1",
    "EX",
    MEMBER_PHONE_VERIFIED_PROOF_TTL_SECONDS,
  );

  return { ok: true };
}

export async function assertPhoneVerified(
  phone: string,
  userKey: string,
): Promise<void> {
  const normalized = normalizeMemberPhone(phone);
  if (!normalized) {
    throw new MemberPhoneOtpError("invalid_phone");
  }

  const redis = getRedisClient();
  await redis.connect().catch(() => undefined);

  const keys = [verifiedKey(userKey, normalized)];
  const signupKey = signupPhoneUserKey(normalized);
  if (userKey !== signupKey) {
    keys.push(verifiedKey(signupKey, normalized));
  }

  for (const key of keys) {
    const proof = await redis.get(key);
    if (proof) return;
  }

  throw new MemberPhoneOtpError("not_verified");
}

export async function consumePhoneVerifiedProof(
  phone: string,
  userKey: string,
): Promise<void> {
  const normalized = normalizeMemberPhone(phone);
  if (!normalized) {
    throw new MemberPhoneOtpError("invalid_phone");
  }

  const redis = getRedisClient();
  await redis.connect().catch(() => undefined);

  const keys = [verifiedKey(userKey, normalized)];
  const signupKey = signupPhoneUserKey(normalized);
  if (userKey !== signupKey) {
    keys.push(verifiedKey(signupKey, normalized));
  }

  for (const key of keys) {
    const proof = await redis.get(key);
    if (proof) {
      await redis.del(key);
      return;
    }
  }

  throw new MemberPhoneOtpError("not_verified");
}

export function signupPhoneUserKey(phone: string): string {
  return `signup:${normalizeMemberPhone(phone)}`;
}
