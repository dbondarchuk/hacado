import { sendEmail } from "@/utils/email/send-email";
import { ServicesContainer } from "@hacado/services";
import type { ReconcileSlotsResult } from "@hacado/types";

export async function notifyOwnerOfMemberReactivations(
  organizationId: string,
  result: ReconcileSlotsResult,
): Promise<void> {
  if (!result.reactivatedMemberIds.length) return;

  const services = ServicesContainer(organizationId);
  const members = await services.teamService.getMembers({
    includeInactive: true,
  });
  const restored = members.filter((m) =>
    result.reactivatedMemberIds.includes(String(m._id)),
  );
  const owner = members.find((m) => m.role === "owner");
  if (!owner?.email) return;

  const org = await services.organizationService.getOrganization();
  const remainingSlots = Math.max(
    0,
    result.availableUsers - result.activeMemberCount,
  );

  await sendEmail("membersReactivated", owner.email, owner.language || "en", {
    name: owner.name || owner.email,
    organizationName: org?.name ?? "",
    memberNames: restored.map((m) => m.name || m.email || m.userId).join(", "),
    remainingSlots,
  });
}
