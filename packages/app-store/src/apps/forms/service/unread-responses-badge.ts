import { DashboardNotificationBadge, IConnectedAppProps } from "@hacado/types";
import { FORMS_UNREAD_RESPONSES_BADGE_KEY } from "../const";
import { FormsRepositoryService } from "./repository-service";

function lastReadRedisKey(
  organizationId: string,
  appId: string,
  memberId: string,
): string {
  return `formsResponses:lastReadAt:${organizationId}:${appId}:${memberId}`;
}

export async function getFormResponsesLastReadAt(
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

export async function markFormResponsesRead(
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

export async function getFormsUnreadResponsesBadges(
  appId: string,
  organizationId: string,
  memberId: string | undefined,
  getDbConnection: IConnectedAppProps["getDbConnection"],
  services: IConnectedAppProps["services"],
): Promise<DashboardNotificationBadge[]> {
  if (!memberId) {
    return [{ key: FORMS_UNREAD_RESPONSES_BADGE_KEY, count: 0 }];
  }

  const lastReadAt = await getFormResponsesLastReadAt(
    organizationId,
    appId,
    memberId,
    services,
  );
  const repository = new FormsRepositoryService(
    appId,
    organizationId,
    getDbConnection,
    services,
  );
  const count = await repository.getResponsesCountSince(lastReadAt);

  return [{ key: FORMS_UNREAD_RESPONSES_BADGE_KEY, count }];
}
