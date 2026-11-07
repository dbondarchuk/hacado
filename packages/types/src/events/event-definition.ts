import type { ActivityRecord } from "../activity/activity-record";
import type { IConnectedAppProps } from "../apps/connected-app.props";
import type { DashboardNotification } from "../apps/notifications/dashboard";
import type { PushNotification } from "../apps/notifications/push";
import type {
  EmailNotificationRequest,
  TextMessageNotificationRequest,
} from "../services/notification.service";
import type { EventEnvelope } from "./envelope";

/**
 * Declares an event type and how side effects are derived when it is emitted.
 */
export type EventDefinition<TPayload = any> = {
  type: string;
  recordActivity?:
    | false
    | ((
        envelope: EventEnvelope<TPayload>,
        services: IConnectedAppProps["services"],
        getDbConnection: IConnectedAppProps["getDbConnection"],
      ) =>
        | ActivityRecord
        | null
        | false
        | Promise<ActivityRecord | null | false>);
  dashboardNotification?:
    | false
    | ((
        envelope: EventEnvelope<TPayload>,
        services: IConnectedAppProps["services"],
        getDbConnection: IConnectedAppProps["getDbConnection"],
      ) =>
        | DashboardNotification
        | null
        | Promise<DashboardNotification | null>);
  pushNotification?:
    | false
    | ((
        envelope: EventEnvelope<TPayload>,
        services: IConnectedAppProps["services"],
        getDbConnection: IConnectedAppProps["getDbConnection"],
      ) => PushNotification | null | Promise<PushNotification | null>);
  emailNotifications?:
    | false
    | ((
        envelope: EventEnvelope<TPayload>,
        services: IConnectedAppProps["services"],
        getDbConnection: IConnectedAppProps["getDbConnection"],
      ) =>
        | EmailNotificationRequest[]
        | null
        | Promise<EmailNotificationRequest[] | null>);
  smsNotifications?:
    | false
    | ((
        envelope: EventEnvelope<TPayload>,
        services: IConnectedAppProps["services"],
        getDbConnection: IConnectedAppProps["getDbConnection"],
      ) =>
        | TextMessageNotificationRequest[]
        | null
        | Promise<TextMessageNotificationRequest[] | null>);
};

export type AppEventConfig = {
  events?: EventDefinition[];
};
