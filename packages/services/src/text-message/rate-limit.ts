import type { Redis } from "ioredis";

const rateLimitPerMinute = () =>
  Number(process.env.SMS_RATE_LIMIT_PER_MINUTE || "60");

const dailyCap = () => Number(process.env.SMS_DAILY_CAP || "1000");

export const consumeSmsPlatformLimit = async (
  redis: Redis,
  organizationId: string,
): Promise<"ok" | "rate" | "daily"> => {
  const minuteBucket = Math.floor(Date.now() / 60000);
  const day = new Date().toISOString().slice(0, 10);
  const minuteKey = `sms:rate:${organizationId}:${minuteBucket}`;
  const dayKey = `sms:daily:${organizationId}:${day}`;

  const minuteCount = await redis.incr(minuteKey);
  if (minuteCount === 1) {
    await redis.expire(minuteKey, 120);
  }

  if (minuteCount > rateLimitPerMinute()) {
    return "rate";
  }

  const dayCount = await redis.incr(dayKey);
  if (dayCount === 1) {
    await redis.expire(dayKey, 60 * 60 * 48);
  }

  if (dayCount > dailyCap()) {
    return "daily";
  }

  return "ok";
};
