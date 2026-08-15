import { ServicesContainer } from "@hacado/services";
import { memberEventSource, SessionUser } from "@hacado/types";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Session with a strongly typed `user` (Better Auth widens custom fields to `string`). */
export type AppSession = Omit<AuthSession, "user"> & { user: SessionUser };

export const getOrganizationIdAndSlug = async () => {
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id") as string;
  const organizationSlug = headersList.get("x-organization-slug") as string;
  const organizationDomain = headersList.get("x-organization-domain") as string;
  if (!organizationId || !organizationSlug) {
    const pathname = headersList.get("x-pathname");
    const isApiCall = pathname?.startsWith("/api");
    if (isApiCall) {
      unauthorized();
    }

    redirect("/auth/signin");
  }

  return {
    organizationId,
    organizationSlug,
    organizationDomain,
  };
};

export const getSession = cache(async (): Promise<AppSession> => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
    query: {
      // Entitlements (plan tier, seats) are derived in customSession from Mongo.
      // Never serve a stale cookie-cache snapshot after Polar webhooks.
      disableCookieCache: true,
    },
  });

  if (!session) {
    const pathname = headersList.get("x-pathname");
    const isApiCall = pathname?.startsWith("/api");
    if (isApiCall) {
      unauthorized();
    }

    redirect("/auth/signin");
  }

  return session as AppSession;
});

export const getUser = cache(async (): Promise<SessionUser> => {
  const session = await getSession();
  return session.user;
});

export const getMember = cache(async () => {
  const session = await getSession();
  const servicesContainer = await getServicesContainer();
  const member = await servicesContainer.teamService.getMemberById(
    session.user.memberId,
  );
  if (!member) {
    throw new Error("Member not found");
  }

  return member;
});

export const getActor = cache(async () => {
  const session = await getSession();
  return memberEventSource(session.user.memberId);
});

export const getServicesContainer = cache(async () => {
  const { organizationId } = await getOrganizationIdAndSlug();

  const servicesContainer = ServicesContainer(organizationId);
  return servicesContainer;
});

export const getOrganizationId = cache(async () => {
  const { organizationId } = await getOrganizationIdAndSlug();
  return organizationId;
});

export const getOrganizationFullDomain = cache(async () => {
  const { organizationSlug, organizationDomain } =
    await getOrganizationIdAndSlug();
  const domain = organizationDomain?.trim();
  return domain || `${organizationSlug}.${process.env.PUBLIC_DOMAIN}`;
});

export const getWebsiteUrl = cache(async () => {
  const organizationDomain = await getOrganizationFullDomain();
  return `https://${organizationDomain}`;
});
