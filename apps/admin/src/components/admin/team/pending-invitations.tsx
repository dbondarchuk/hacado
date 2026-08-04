import { auth } from "@/app/auth";
import { getOrganizationId } from "@/app/utils";
import { getI18nAsync } from "@timelish/i18n/server";
import { UserRole } from "@timelish/types";
import { headers } from "next/headers";
import { CancelInvitationButton } from "./cancel-invitation-button";

export async function PendingInvitations() {
  const t = await getI18nAsync("admin");

  let invitations: Array<{ id: string; email: string; role: UserRole }> = [];
  try {
    const list = await auth.api.listInvitations({
      query: { organizationId: await getOrganizationId() },
      headers: await headers(),
    });
    invitations = (list ?? [])
      .filter((i) => i.status === "pending")
      .map((i) => ({
        id: i.id,
        email: i.email,
        role: String(i.role) as UserRole,
      }));
  } catch {
    invitations = [];
  }

  if (!invitations.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">{t("team.pendingInvitations")}</h2>
      <ul className="space-y-2">
        {invitations.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {inv.email} · {t(`roles.${inv.role}`)}
            </span>
            <CancelInvitationButton invitationId={inv.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
