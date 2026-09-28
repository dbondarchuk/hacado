import { getRedisClient } from "@hacado/services";

function dismissalsRedisKey(organizationId: string, memberId: string) {
  return `dashboard:needs-attention-dismissed:${organizationId}:${memberId}`;
}

export async function listNeedsAttentionDismissals(
  organizationId: string,
  memberId: string,
): Promise<Set<string>> {
  const redis = getRedisClient();
  const members = await redis.smembers(
    dismissalsRedisKey(organizationId, memberId),
  );

  return new Set(members);
}

export async function dismissNeedsAttentionItem(
  organizationId: string,
  memberId: string,
  compositeKey: string,
): Promise<void> {
  const redis = getRedisClient();

  await redis.sadd(dismissalsRedisKey(organizationId, memberId), compositeKey);
}

export async function pruneNeedsAttentionDismissals(
  organizationId: string,
  memberId: string,
  activeKeys: string[],
): Promise<void> {
  const redis = getRedisClient();
  const key = dismissalsRedisKey(organizationId, memberId);
  const stored = await redis.smembers(key);
  if (!stored.length) {
    return;
  }

  const active = new Set(activeKeys);
  const stale = stored.filter((item) => !active.has(item));
  if (stale.length) {
    await redis.srem(key, ...stale);
  }

  const remaining = await redis.scard(key);
  if (remaining === 0) {
    await redis.del(key);
  }
}
