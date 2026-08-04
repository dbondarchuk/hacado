import type { ActivityListItem } from "../activity/activity-list-item";
import type { ActivityListQuery } from "../activity/activity-query";
import type { ActivityRecord } from "../activity/activity-record";
import type { ActivitySeverity } from "../activity/activity-severity";
import type { ActivityFeedPreview } from "../apps/notifications/dashboard";
import type { WithTotal } from "../database/with-total";

export interface IActivityService {
  record(activity: ActivityRecord): Promise<string>;
  getActivities(query: ActivityListQuery): Promise<WithTotal<ActivityListItem>>;
  getUnreadActivityCount(memberId: string): Promise<number>;
  /** Marks activity as seen for this member’s feed badge; publishes dashboard notification. */
  markActivityFeedRead(memberId: string): Promise<void>;
  getActivityPreview(limit: number): Promise<ActivityFeedPreview[]>;
  getHighestSeveritySinceLastRead(
    memberId: string,
  ): Promise<ActivitySeverity | null>;
  /** Distinct `eventType` values for filter UI (paginated, optional substring search). */
  getDistinctEventTypes(query: {
    search?: string;
    offset: number;
    limit: number;
  }): Promise<WithTotal<string>>;
}
