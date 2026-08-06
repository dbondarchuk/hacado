import { DashboardNotificationBadge, IConnectedAppProps } from "@hacado/types";
import { GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY } from "../const";
import { GiftCardStudioRepositoryService } from "./repository-service";

function lastReadRedisKey(
  organizationId: string,
  appId: string,
  memberId: string,
): string {
  return `giftCardStudioPurchases:lastReadAt:${organizationId}:${appId}:${memberId}`;
}

export async function getGiftCardStudioPurchasesLastReadAt(
  organizationId: string,
  appId: string,
  memberId: string,
  services: IConnectedAppProps["services"],
): Promise<Date> {
  const lastRead = await services.redisClient.get(
    lastReadRedisKey(organizationId, appId, memberId),
  );
  return lastRead ? new Date(lastRead) : new Date(0);
}

export async function markGiftCardStudioPurchasesRead(
  organizationId: string,
  appId: string,
  memberId: string,
  services: IConnectedAppProps["services"],
): Promise<void> {
  await services.redisClient.set(
    lastReadRedisKey(organizationId, appId, memberId),
    new Date().toISOString(),
  );
}

export async function getGiftCardStudioUnreadPurchasesBadges(
  appId: string,
  organizationId: string,
  memberId: string | undefined,
  getDbConnection: IConnectedAppProps["getDbConnection"],
  services: IConnectedAppProps["services"],
): Promise<DashboardNotificationBadge[]> {
  if (!memberId) {
    return [{ key: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY, count: 0 }];
  }

  const lastReadAt = await getGiftCardStudioPurchasesLastReadAt(
    organizationId,
    appId,
    memberId,
    services,
  );
  const repository = new GiftCardStudioRepositoryService(
    appId,
    organizationId,
    getDbConnection,
    services,
  );
  const count = await repository.getCustomerPurchasesCountSince(lastReadAt);

  return [{ key: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY, count }];
}
