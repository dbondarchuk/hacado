import { auth } from "@/app/auth";
import { takePendingMemberProfile } from "@/lib/auth/pending-member-profile";
import type { Language } from "@hacado/i18n";
import { getPolarClient } from "@hacado/services";
import {
  MEMBERS_COLLECTION_NAME,
  ORGANIZATIONS_COLLECTION_NAME,
} from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { OrganizationMember, User } from "@hacado/types";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";

/**
 * Ensures the signed-in user has an organization document for org-level Polar billing
 * (placeholder slug/name until install step 1 updates them), plus an owner member row.
 */
export async function ensureBillingOrganizationForUser(): Promise<string> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existing = (
    session.user as { organizationId?: string }
  ).organizationId?.trim();
  if (existing) {
    await ensureOwnerMemberForOrganization(existing, session.user.id, {
      name: session.user.name,
      phone: (session.user as { phone?: string }).phone,
      language: (session.user as { language?: Language }).language,
      image: session.user.image,
    });
    await setActiveOrganizationIfNeeded(existing, headersList);
    return existing;
  }

  const db = await getDbConnection();
  const orgId = new ObjectId().toString();
  const slug = `pending-${orgId}`;
  const displayName = session.user.name || session.user.email;

  await db.collection(ORGANIZATIONS_COLLECTION_NAME).insertOne({
    _id: orgId,
    slug,
    name: displayName,
    createdAt: new Date(),
    isInstalled: false,
    userSlots: { included: 1, additional: 0 },
    availableUsers: 1,
    userSlotGrants: [],
    allowAdditionalUsers: false,
  } as any);

  await ensureOwnerMemberForOrganization(orgId, session.user.id, {
    name: session.user.name,
    phone: (session.user as { phone?: string }).phone,
    language: (session.user as { language?: Language }).language,
    image: session.user.image,
  });

  await setActiveOrganizationIfNeeded(orgId, headersList);

  // Keep Better Auth organization plugin in sync with the same id when possible.
  try {
    await auth.api.createOrganization({
      body: {
        name: displayName,
        slug,
        userId: session.user.id,
        keepCurrentActiveOrganization: true,
      } as any,
      headers: headersList,
    });
  } catch {
    // Organization may already exist or createOrganization may require different shape;
    // member row above is the source of truth for team features.
  }

  await getPolarClient().ensureTeamCustomerForOrganization({
    organizationId: orgId,
    ownerUserId: session.user.id,
    ownerEmail: session.user.email,
    ownerName: displayName,
    teamName: displayName,
  });

  return orgId;
}

async function setActiveOrganizationIfNeeded(
  organizationId: string,
  headersList: Headers,
): Promise<void> {
  try {
    await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: headersList,
    });
  } catch {
    // Session may already be active for this org, or plugin may reject duplicates.
  }
}

async function ensureOwnerMemberForOrganization(
  organizationId: string,
  userId: string,
  fallbackProfile?: {
    name?: string;
    phone?: string;
    language?: Language;
    image?: string | null;
  },
): Promise<void> {
  const db = await getDbConnection();
  const authUser = await db
    .collection<User>("users")
    .findOne({ _id: userId }, { projection: { email: 1, image: 1 } });
  const email = authUser?.email?.toLowerCase();
  const pending = await takePendingMemberProfile(userId, email);
  const profile = {
    name: pending?.name || fallbackProfile?.name || "",
    phone: pending?.phone || fallbackProfile?.phone || "",
    language: pending?.language || fallbackProfile?.language || "en",
    email: email || "",
    image: fallbackProfile?.image || authUser?.image || null,
  };

  const existing = await db
    .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
    .findOne({ organizationId, userId });

  if (existing) {
    const $set: Record<string, unknown> = {};
    if (!existing.name && profile.name) $set.name = profile.name;
    if (!existing.phone && profile.phone) $set.phone = profile.phone;
    if (!existing.language && profile.language)
      $set.language = profile.language;
    if (!existing.email && profile.email) $set.email = profile.email;
    if (!existing.image && profile.image) $set.image = profile.image;
    if (Object.keys($set).length) {
      await db
        .collection(MEMBERS_COLLECTION_NAME)
        .updateOne({ _id: existing._id as any }, { $set });
    }
    return;
  }

  const memberId = new ObjectId().toString();
  await db.collection(MEMBERS_COLLECTION_NAME).insertOne({
    _id: memberId,
    organizationId,
    userId,
    role: "owner",
    createdAt: new Date(),
    status: "active",
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    language: profile.language,
    image: profile.image,
    bio: null,
    calendarSources: [],
  } as any);
}
