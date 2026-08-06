import { DashboardNotificationBadge, IConnectedAppProps } from "@hacado/types";
import { BLOG_PENDING_COMMENTS_BADGE_KEY } from "../const";
import { BlogRepositoryService } from "./repository-service";

export async function getBlogPendingCommentsBadges(
  appId: string,
  organizationId: string,
  getDbConnection: IConnectedAppProps["getDbConnection"],
  services: IConnectedAppProps["services"],
): Promise<DashboardNotificationBadge[]> {
  const repository = new BlogRepositoryService(
    appId,
    organizationId,
    getDbConnection,
    services,
  );
  const count = await repository.getPendingCommentsCount();

  return [{ key: BLOG_PENDING_COMMENTS_BADGE_KEY, count }];
}
