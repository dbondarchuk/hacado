import { v4, v5 } from "uuid";
const NAMESPACE = "d80b729d-984c-4a30-ad90-70ae466a08a1";

export function generateId(seed?: string) {
  const uuid = seed ? v5(seed, NAMESPACE) : v4();
  return `block-${uuid}`;
}

/**
 * Fresh empty document from a catalog root template.
 * Never reuse the module-level RootBlock by reference - AI/editor mutations
 * would otherwise leak across new page/email sessions.
 */
export function createFreshRootDocument<
  T extends { id: string; data: unknown },
>(rootBlock: T): T {
  const cloned = JSON.parse(JSON.stringify(rootBlock)) as T;
  cloned.id = generateId();
  return cloned;
}
