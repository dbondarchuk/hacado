"use server";

import { auth } from "@/app/auth";
import {
  MemberPhoneOtpError,
  requestMemberPhoneOtp as requestOtp,
  signupPhoneUserKey,
  verifyMemberPhoneOtp as verifyOtp,
  type MemberPhoneOtpContext,
  type MemberPhoneOtpErrorCode,
} from "@/lib/auth/member-phone-otp";
import { normalizeMemberPhone } from "@/lib/auth/member-phone-uniqueness";
import { headers } from "next/headers";

export type PhoneOtpActionResult =
  | { ok: true; cooldownSeconds?: number }
  | { ok: false; code: MemberPhoneOtpErrorCode };

async function resolveContext(
  kind: MemberPhoneOtpContext["kind"],
  phone: string,
): Promise<MemberPhoneOtpContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  const normalized = normalizeMemberPhone(phone);
  const language =
    (session?.user as { language?: "en" | "uk" } | undefined)?.language ?? "en";

  if (kind === "signup" && !session?.user?.id) {
    return {
      kind,
      userKey: signupPhoneUserKey(normalized),
      language,
    };
  }

  if (!session?.user?.id) {
    throw new MemberPhoneOtpError("invalid_phone");
  }

  const memberId = (session.user as { memberId?: string }).memberId;

  return {
    kind,
    userKey: session.user.id,
    excludeUserId: session.user.id,
    excludeMemberId: kind === "profile-change" ? memberId : undefined,
    language,
  };
}

export async function requestMemberPhoneOtpAction(
  phone: string,
  kind: MemberPhoneOtpContext["kind"],
): Promise<PhoneOtpActionResult> {
  try {
    const context = await resolveContext(kind, phone);
    const result = await requestOtp(phone, context);
    return { ok: true, cooldownSeconds: result.cooldownSeconds };
  } catch (error) {
    if (error instanceof MemberPhoneOtpError) {
      return { ok: false, code: error.code };
    }
    console.error(error);
    return { ok: false, code: "sms_failed" };
  }
}

export async function verifyMemberPhoneOtpAction(
  phone: string,
  code: string,
  kind: MemberPhoneOtpContext["kind"],
): Promise<PhoneOtpActionResult> {
  try {
    const context = await resolveContext(kind, phone);
    await verifyOtp(phone, code, context);
    return { ok: true };
  } catch (error) {
    if (error instanceof MemberPhoneOtpError) {
      return { ok: false, code: error.code };
    }
    console.error(error);
    return { ok: false, code: "invalid_code" };
  }
}
