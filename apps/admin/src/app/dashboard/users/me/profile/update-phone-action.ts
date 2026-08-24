"use server";

import { getActor, getServicesContainer, getSession } from "@/app/utils";
import {
  consumePhoneVerifiedProof,
  MemberPhoneOtpError,
  type MemberPhoneOtpErrorCode,
} from "@/lib/auth/member-phone-otp";
import {
  isMemberPhoneAvailable,
  normalizeMemberPhone,
} from "@/lib/auth/member-phone-uniqueness";

export async function updateMyPhone(
  phone: string,
): Promise<
  { ok: true } | { ok: false; code: MemberPhoneOtpErrorCode | "unauthorized" }
> {
  const session = await getSession().catch(() => null);
  if (!session?.user?.id || !session.user.memberId) {
    return { ok: false, code: "unauthorized" };
  }

  const normalized = normalizeMemberPhone(phone);
  if (!normalized) {
    return { ok: false, code: "invalid_phone" };
  }

  const available = await isMemberPhoneAvailable(normalized, {
    excludeMemberId: session.user.memberId,
    excludeUserId: session.user.id,
  });
  if (!available) {
    return { ok: false, code: "phone_in_use" };
  }

  try {
    await consumePhoneVerifiedProof(normalized, session.user.id);
  } catch (error) {
    if (error instanceof MemberPhoneOtpError) {
      return { ok: false, code: error.code };
    }
    return { ok: false, code: "not_verified" };
  }

  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  await servicesContainer.teamService.updateMemberProfile(
    session.user.memberId,
    { phone: normalized },
    actor,
  );

  return { ok: true };
}
