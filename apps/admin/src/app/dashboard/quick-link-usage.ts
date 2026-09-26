import { getRedisClient } from "@hacado/services";

const QUICK_LINK_USAGE_TTL_SECONDS = 60 * 60 * 24 * 180;

function usageRedisKey(organizationId: string, memberId: string) {
  return `dashboard:quick-link-usage:${organizationId}:${memberId}`;
}

export async function getQuickLinkUsageScores(
  organizationId: string,
  memberId: string,
): Promise<Map<string, number>> {
  const redis = getRedisClient();
  const entries = await redis.zrevrange(
    usageRedisKey(organizationId, memberId),
    0,
    -1,
    "WITHSCORES",
  );

  const scores = new Map<string, number>();
  for (let i = 0; i < entries.length; i += 2) {
    const member = entries[i];
    const score = entries[i + 1];

    if (!member || score === undefined) continue;

    scores.set(member, Number(score));
  }

  return scores;
}

export async function incrementQuickLinkUsage(
  organizationId: string,
  memberId: string,
  usageKey: string,
): Promise<void> {
  const redis = getRedisClient();
  const key = usageRedisKey(organizationId, memberId);
  const pipeline = redis.pipeline();
  pipeline.zincrby(key, 1, usageKey);
  pipeline.expire(key, QUICK_LINK_USAGE_TTL_SECONDS);
  await pipeline.exec();
}
