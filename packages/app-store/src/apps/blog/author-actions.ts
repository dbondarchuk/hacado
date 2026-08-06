"use server";

export type OrganizationAuthorMember = {
  id: string;
  name: string;
};

export async function getOrganizationAuthorMembers(): Promise<
  OrganizationAuthorMember[]
> {
  const { headers } = await import("next/headers");
  const { ServicesContainer } = await import("@hacado/services");

  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");
  if (!organizationId) {
    return [];
  }

  const members =
    await ServicesContainer(organizationId).teamService.getActiveMembers();

  return members
    .filter((m) => m.role === "owner" || m.role === "admin")
    .map((m) => ({
      id: typeof m._id === "string" ? m._id : String(m._id),
      name: m.name || m.email || String(m._id),
    }));
}
