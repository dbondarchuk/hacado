import { cache } from "react";

const inflightMemberNames = new Map<string, Promise<string | null>>();

const inflightKey = (organizationId: string, memberId: string) =>
  `${organizationId}:${memberId}`;

async function fetchBlogAuthorMemberName(
  organizationId: string,
  memberId: string,
): Promise<string | null> {
  const key = inflightKey(organizationId, memberId);
  const pending = inflightMemberNames.get(key);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const { ServicesContainer } = await import("@timelish/services");
    const member =
      await ServicesContainer(organizationId).teamService.getMemberById(
        memberId,
      );
    return member?.name ?? null;
  })();

  inflightMemberNames.set(key, promise);

  try {
    return await promise;
  } finally {
    if (inflightMemberNames.get(key) === promise) {
      inflightMemberNames.delete(key);
    }
  }
}

/** Cached per-request; concurrent lookups for the same member reuse one in-flight promise. */
export const getBlogAuthorMemberName = cache(fetchBlogAuthorMemberName);
