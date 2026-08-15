"use server";

import { getOrganizationSlugIssue } from "@/components/install/organization-slug";
import { StaticOrganizationService } from "@hacado/services";

export async function checkOrganizationSlug(
  slug: string,
  currentOrganizationId?: string | null,
) {
  if (getOrganizationSlugIssue(slug)) {
    return false;
  }
  const existing = await new StaticOrganizationService().getOrganizationBySlug(
    slug,
  );
  if (!existing) return true;
  if (
    currentOrganizationId &&
    String(existing._id) === String(currentOrganizationId)
  ) {
    return true;
  }
  return false;
}
