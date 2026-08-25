"use server";

import { auth } from "@/app/auth";
import {
  consumePhoneVerifiedProof,
  MemberPhoneOtpError,
  signupPhoneUserKey,
} from "@/lib/auth/member-phone-otp";
import {
  isMemberPhoneAvailable,
  normalizeMemberPhone,
} from "@/lib/auth/member-phone-uniqueness";
import {
  savePendingMemberProfile,
  savePendingMemberProfileByEmail,
  type PendingMemberProfile,
} from "@/lib/auth/pending-member-profile";
import { headers } from "next/headers";

export async function saveSignupMemberProfile(
  profile: PendingMemberProfile & { email?: string; userId?: string },
): Promise<{ ok: boolean; code?: string }> {
  const { email, userId, ...rest } = profile;
  const phone = normalizeMemberPhone(rest.phone ?? "");
  if (!phone) {
    return { ok: false, code: "invalid_phone" };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id || userId;

  const available = await isMemberPhoneAvailable(phone, {
    excludeUserId: id,
  });
  if (!available) {
    return { ok: false, code: "phone_in_use" };
  }

  const userKey = id || signupPhoneUserKey(phone);
  try {
    await consumePhoneVerifiedProof(phone, userKey);
  } catch (error) {
    if (error instanceof MemberPhoneOtpError) {
      return { ok: false, code: error.code };
    }
    return { ok: false, code: "not_verified" };
  }

  const pending = { ...rest, phone };

  if (id) {
    await savePendingMemberProfile(id, pending);
    return { ok: true };
  }
  if (email) {
    await savePendingMemberProfileByEmail(email, pending);
    return { ok: true };
  }
  return { ok: false, code: "unauthorized" };
}
