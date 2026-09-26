import { getOrganizationId, getSession } from "../utils";
import { collectNeedsAttentionRows } from "./collect-needs-attention";
import { NeedsAttentionList } from "./needs-attention-list";

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
