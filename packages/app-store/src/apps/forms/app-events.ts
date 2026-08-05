import type { AppEventConfig, EventDefinition } from "@hacado/types";
import { FORMS_UNREAD_RESPONSES_BADGE_KEY } from "./const";
import {
  FORM_RESPONSE_CREATED_EVENT_TYPE,
  type FormResponseCreatedPayload,
} from "./models/events";
import { FormsAdminAllKeys } from "./translations/types";

export const FORMS_APP_EVENTS: AppEventConfig = {
  events: [
    {
      type: FORM_RESPONSE_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { form, formResponse } =
          envelope.payload as FormResponseCreatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_forms_admin.responses.events.responseCreated.title" satisfies FormsAdminAllKeys,
          },
          description: {
            key: "app_forms_admin.responses.events.responseCreated.description" satisfies FormsAdminAllKeys,
            args: {
              formName: form.name,
              responseId: formResponse._id.toString(),
            },
          },
          link: "/dashboard/forms/responses/edit?id=${formResponse._id}",
          source: envelope.source,
        };
      },
      dashboardNotification: (envelope) => {
        if (envelope.source.actor !== "customer") {
          return null;
        }
        const { formResponse } = envelope.payload as FormResponseCreatedPayload;
        return {
          type: "form-response-created",
          incrementBadgeKey: FORMS_UNREAD_RESPONSES_BADGE_KEY,
          toast: {
            type: "info",
            title: {
              key: "app_forms_admin.notifications.newResponse" satisfies FormsAdminAllKeys,
            },
            message: {
              key: "app_forms_admin.notifications.newResponseMessage" satisfies FormsAdminAllKeys,
            },
            action: {
              label: {
                key: "app_forms_admin.notifications.viewResponse" satisfies FormsAdminAllKeys,
              },
              href: `/dashboard/forms/responses/edit?id=${formResponse._id}`,
            },
          },
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<FormResponseCreatedPayload>,
  ],
};
