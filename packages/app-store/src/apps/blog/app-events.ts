import type { AppEventConfig, EventDefinition } from "@hacado/types";
import { buildNewBlogCommentEmailNotifications } from "./emails/new-comment-email";
import { blogConfigurationSchema } from "./models";
import {
  BLOG_COMMENT_CREATED_EVENT_TYPE,
  BLOG_COMMENT_DELETED_EVENT_TYPE,
  BLOG_COMMENT_STATUS_CHANGED_EVENT_TYPE,
  BLOG_POST_CREATED_EVENT_TYPE,
  BLOG_POST_DELETED_EVENT_TYPE,
  BLOG_POST_UPDATED_EVENT_TYPE,
  type BlogCommentCreatedPayload,
  type BlogCommentDeletedPayload,
  type BlogCommentStatusChangedPayload,
  type BlogPostCreatedPayload,
  type BlogPostDeletedPayload,
  type BlogPostUpdatedPayload,
} from "./models/events";
import { getBlogPendingCommentsBadges } from "./service/pending-comments-badge";
import { BlogAdminAllKeys } from "./translations/types";

export const BLOG_APP_EVENTS: AppEventConfig = {
  events: [
    {
      type: BLOG_POST_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { post } = envelope.payload as BlogPostCreatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_blog_admin.events.postCreated.title" satisfies BlogAdminAllKeys,
          },
          description: {
            key: "app_blog_admin.events.postCreated.description" satisfies BlogAdminAllKeys,
            args: { postTitle: post.title },
          },
          link: `/dashboard/blog/edit?id=${post._id}`,
          source: envelope.source,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<BlogPostCreatedPayload>,
    {
      type: BLOG_POST_UPDATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { post } = envelope.payload as BlogPostUpdatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_blog_admin.events.postUpdated.title" satisfies BlogAdminAllKeys,
          },
          description: {
            key: "app_blog_admin.events.postUpdated.description" satisfies BlogAdminAllKeys,
            args: { postTitle: post.title },
          },
          link: `/dashboard/blog/edit?id=${post._id}`,
          source: envelope.source,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<BlogPostUpdatedPayload>,
    {
      type: BLOG_POST_DELETED_EVENT_TYPE,
      recordActivity: (envelope) => ({
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "app_blog_admin.events.postDeleted.title" satisfies BlogAdminAllKeys,
        },
        description: {
          key: "app_blog_admin.events.postDeleted.description" satisfies BlogAdminAllKeys,
        },
        source: envelope.source,
      }),
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<BlogPostDeletedPayload>,
    {
      type: BLOG_COMMENT_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { comment, post } = envelope.payload as BlogCommentCreatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_blog_admin.events.commentCreated.title" satisfies BlogAdminAllKeys,
          },
          description: {
            key: "app_blog_admin.events.commentCreated.description" satisfies BlogAdminAllKeys,
            args: {
              authorName: comment.authorName,
              postTitle: post.title,
            },
          },
          link: `/dashboard/blog/comments?postId=${post._id}`,
          source: envelope.source,
        };
      },
      dashboardNotification: async (envelope, services, getDbConnection) => {
        const payload = envelope.payload as BlogCommentCreatedPayload;
        const badges = await getBlogPendingCommentsBadges(
          payload.appId,
          envelope.organizationId,
          getDbConnection,
          services,
        );

        if (envelope.source.actor !== "visitor") {
          return {
            type: "blog-pending-comments",
            badges,
          };
        }

        const { comment, post } = payload;
        return {
          type: "blog-comment-created",
          badges,
          toast: {
            type: "info",
            title: {
              key: "app_blog_admin.notifications.newComment" satisfies BlogAdminAllKeys,
            },
            message: {
              key: "app_blog_admin.notifications.newCommentMessage" satisfies BlogAdminAllKeys,
            },
            action: {
              label: {
                key: "app_blog_admin.notifications.viewComment" satisfies BlogAdminAllKeys,
              },
              href: `/dashboard/blog/comments?postId=${post._id}&commentId=${comment._id}`,
            },
          },
        };
      },
      emailNotifications: async (envelope, services) => {
        if (envelope.source.actor !== "visitor") {
          return null;
        }

        const payload = envelope.payload as BlogCommentCreatedPayload;

        let config;
        try {
          const app = await services.connectedAppsService.getApp(payload.appId);
          config = blogConfigurationSchema.parse(app.data ?? {});
        } catch {
          return null;
        }

        if (!config.commentsEnabled || !config.sendEmailOnNewComment) {
          return null;
        }

        const admins =
          await services.teamService.getOrganizationAdminContacts();
        if (!admins.length) {
          return null;
        }

        const organization =
          await services.organizationService.getOrganization();
        const organizationLabel =
          organization?.name?.trim() || organization?.slug || "";

        return buildNewBlogCommentEmailNotifications(
          payload,
          admins,
          organizationLabel ? { config: { name: organizationLabel } } : {},
        );
      },
      smsNotifications: false,
    } as EventDefinition<BlogCommentCreatedPayload>,
    {
      type: BLOG_COMMENT_DELETED_EVENT_TYPE,
      recordActivity: (envelope) => ({
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "app_blog_admin.events.commentDeleted.title" satisfies BlogAdminAllKeys,
        },
        description: {
          key: "app_blog_admin.events.commentDeleted.description" satisfies BlogAdminAllKeys,
        },
        link: `/dashboard/blog/comments?postId=${(envelope.payload as BlogCommentDeletedPayload).postId}`,
        source: envelope.source,
      }),
      dashboardNotification: async (envelope, services, getDbConnection) => {
        const payload = envelope.payload as BlogCommentDeletedPayload;
        const badges = await getBlogPendingCommentsBadges(
          payload.appId,
          envelope.organizationId,
          getDbConnection,
          services,
        );

        return {
          type: "blog-pending-comments",
          badges,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<BlogCommentDeletedPayload>,
    {
      type: BLOG_COMMENT_STATUS_CHANGED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { comment, status } =
          envelope.payload as BlogCommentStatusChangedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_blog_admin.events.commentStatusChanged.title" satisfies BlogAdminAllKeys,
          },
          description: {
            key: "app_blog_admin.events.commentStatusChanged.description" satisfies BlogAdminAllKeys,
            args: {
              authorName: comment.authorName,
              status,
            },
          },
          link: `/dashboard/blog/comments?postId=${comment.postId}`,
          source: envelope.source,
        };
      },
      dashboardNotification: async (envelope, services, getDbConnection) => {
        const payload = envelope.payload as BlogCommentStatusChangedPayload;
        const badges = await getBlogPendingCommentsBadges(
          payload.appId,
          envelope.organizationId,
          getDbConnection,
          services,
        );

        return {
          type: "blog-pending-comments",
          badges,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<BlogCommentStatusChangedPayload>,
  ],
};
