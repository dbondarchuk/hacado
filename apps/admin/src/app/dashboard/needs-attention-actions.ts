"use server";

import { getOrganizationId, getSession } from "@/app/utils";
import { dismissNeedsAttentionItem } from "./needs-attention-dismissals";

export async function dismissNeedsAttentionAction(
  compositeKey: string,
): Promise<{ ok: true } | { ok: false }> {
  const session = await getSession();
  const memberId = session?.user?.memberId;
  if (!memberId || !compositeKey) {
    return { ok: false };
  }

  const organizationId = await getOrganizationId();
  await dismissNeedsAttentionItem(organizationId, memberId, compositeKey);
  return { ok: true };
}
