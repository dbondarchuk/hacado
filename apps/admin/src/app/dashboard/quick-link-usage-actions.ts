"use server";

import { getOrganizationId, getSession } from "@/app/utils";
import { incrementQuickLinkUsage } from "./quick-link-usage";

const MAX_USAGE_KEY_LENGTH = 128;

export async function recordQuickLinkUsageAction(
  usageKey: string,
): Promise<{ ok: true } | { ok: false }> {
  const session = await getSession();
  const memberId = session?.user?.memberId;
  if (
    !memberId ||
    typeof usageKey !== "string" ||
    !usageKey ||
    usageKey.length > MAX_USAGE_KEY_LENGTH
  ) {
    return { ok: false };
  }

  const organizationId = await getOrganizationId();
  await incrementQuickLinkUsage(organizationId, memberId, usageKey);
  return { ok: true };
}
