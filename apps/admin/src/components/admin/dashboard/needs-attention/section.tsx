import { getOrganizationId, getSession } from "@/app/utils";
import { collectNeedsAttentionRows } from "./collect";
import { NeedsAttentionList } from "./list";

export async function NeedsAttentionSection() {
  const [session, organizationId] = await Promise.all([
    getSession(),
    getOrganizationId(),
  ]);

  if (!session?.user) {
    return null;
  }

  const items = await collectNeedsAttentionRows(session.user, organizationId);
  return <NeedsAttentionList items={items} />;
}
