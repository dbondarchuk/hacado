import { renderUserEmailTemplate } from "@timelish/email-builder/static";
import { fallbackLanguage, type Language } from "@timelish/i18n";
import { getI18nAsync } from "@timelish/i18n/server";
import type { EmailNotificationRequest } from "@timelish/types";
import { getAdminUrl } from "@timelish/utils";
import type { BlogCommentCreatedPayload } from "../models/events";
import { BlogAdminAllKeys } from "../translations/types";

type AdminRecipient = {
  memberId: string;
  email: string;
  name: string;
  language?: string | null;
};

const truncateBody = (body: string, maxLength = 500) => {
  if (body.length <= maxLength) {
    return body;
  }
  return `${body.slice(0, maxLength)}…`;
};

export const buildNewBlogCommentEmailNotifications = async (
  payload: BlogCommentCreatedPayload,
  admins: AdminRecipient[],
  layoutArgs: Record<string, unknown> = {},
): Promise<EmailNotificationRequest[] | null> => {
  const { comment, post, status } = payload;
  const adminUrl = getAdminUrl();
  const commentsUrl = `${adminUrl}/dashboard/blog/comments?postId=${post._id}&commentId=${comment._id}`;
  const rejectUrl = `${adminUrl}/dashboard/blog/comments/reject?id=${comment._id}`;
  const approveUrl = `${adminUrl}/dashboard/blog/comments/approve?id=${comment._id}`;

  const notifications: EmailNotificationRequest[] = [];

  for (const admin of admins) {
    if (!admin.email) {
      continue;
    }

    const locale: Language =
      admin.language === "uk" || admin.language === "en"
        ? admin.language
        : fallbackLanguage;

    const t = await getI18nAsync({ locale });

    const interpolation = {
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      postTitle: post.title,
      commentBody: truncateBody(comment.body),
      userName: admin.name,
    };

    const subject = t(
      "app_blog_admin.emails.newComment.subject" satisfies BlogAdminAllKeys,
      interpolation,
    );

    const content: Parameters<typeof renderUserEmailTemplate>[0]["content"] = [
      {
        type: "title",
        text: t(
          "app_blog_admin.emails.newComment.title" satisfies BlogAdminAllKeys,
          interpolation,
        ),
        level: "h2",
      },
      {
        type: "text",
        text: t(
          "app_blog_admin.emails.newComment.body" satisfies BlogAdminAllKeys,
          interpolation,
        ),
      },
    ];

    if (status === "pending") {
      content.push({
        type: "button",
        button: {
          text: t(
            "app_blog_admin.emails.newComment.approve" satisfies BlogAdminAllKeys,
          ),
          url: approveUrl,
          backgroundColor: "#059669",
        },
      });
    }

    content.push(
      {
        type: "button",
        button: {
          text: t(
            "app_blog_admin.emails.newComment.reject" satisfies BlogAdminAllKeys,
          ),
          url: rejectUrl,
          backgroundColor: "#ef4444",
        },
      },
      {
        type: "button",
        button: {
          text: t(
            "app_blog_admin.emails.newComment.view" satisfies BlogAdminAllKeys,
          ),
          url: commentsUrl,
          backgroundColor: "#0066ff",
        },
      },
    );

    const body = await renderUserEmailTemplate(
      {
        previewText: subject,
        content,
      },
      layoutArgs,
    );

    notifications.push({
      email: {
        to: admin.email,
        subject,
        body,
      },
      handledBy:
        "app_blog_admin.handlers.newCommentEmail" satisfies BlogAdminAllKeys,
      participantType: "member",
      memberId: admin.memberId,
    });
  }

  return notifications.length ? notifications : null;
};
