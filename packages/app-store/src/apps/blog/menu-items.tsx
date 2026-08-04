import { AppMenuItem } from "@timelish/types";
import { FileText, MessageSquare, Settings } from "lucide-react";
import { BLOG_PENDING_COMMENTS_BADGE_KEY } from "./const";
import { BlogCommentApprovePage } from "./comments/pages/approve";
import { BlogCommentRejectPage } from "./comments/pages/reject";
import { BlogCommentsPage } from "./comments/pages/main";
import { BlogSettingsPage } from "./settings/pages/main";
import { BlogEditPage } from "./pages/edit";
import { BlogPage } from "./pages/main";
import { BlogNewPage } from "./pages/new";
import {
  BlogAdminAllKeys,
  BlogAdminKeys,
  BlogAdminNamespace,
} from "./translations/types";

const blogBreadcrumb: {
  title: BlogAdminAllKeys;
  link: string;
} = {
  title: "app_blog_admin.app.pages.main.label",
  link: "/dashboard/blog",
};

export const BlogMenuItems: AppMenuItem<BlogAdminNamespace, BlogAdminKeys>[] = [
  {
    href: "blog",
    id: "blog",
    group: "website",
    order: 100,
    notScrollable: true,
    label: "app_blog_admin.app.pages.main.label" satisfies BlogAdminAllKeys,
    icon: <FileText />,
    Page: (props) => <BlogPage appId={props.appId} />,
    pageBreadcrumbs: [blogBreadcrumb],
    pageTitle: "app_blog_admin.app.pages.main.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.main.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "blog/settings",
    parent: "blog",
    id: "blog-settings",
    order: 105,
    notScrollable: true,
    label: "app_blog_admin.app.pages.settings.label" satisfies BlogAdminAllKeys,
    icon: <Settings />,
    Page: (props) => <BlogSettingsPage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.settings.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/settings",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.settings.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.settings.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "settings", action: "update" },
  },
  {
    href: "blog/comments",
    parent: "blog",
    id: "blog-comments",
    order: 110,
    notScrollable: true,
    notificationsCountKey: BLOG_PENDING_COMMENTS_BADGE_KEY,
    label: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
    icon: <MessageSquare />,
    Page: (props) => <BlogCommentsPage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/comments",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.comments.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.comments.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "blog/new",
    parent: "blog",
    id: "blog-new",
    isHidden: true,
    hideHeading: true,
    label: "app_blog_admin.app.pages.new.label" satisfies BlogAdminAllKeys,
    icon: <FileText />,
    Page: (props) => <BlogNewPage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.new.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/new",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.new.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.new.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "blog/comments/approve",
    parent: "blog",
    id: "blog-comment-approve",
    isHidden: true,
    label: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
    icon: <MessageSquare />,
    Page: (props) => <BlogCommentApprovePage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/comments",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.comments.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.comments.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "blog/comments/reject",
    parent: "blog",
    id: "blog-comment-reject",
    isHidden: true,
    label: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
    icon: <MessageSquare />,
    Page: (props) => <BlogCommentRejectPage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.comments.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/comments",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.comments.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.comments.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "blog/edit",
    parent: "blog",
    id: "blog-edit",
    isHidden: true,
    hideHeading: true,
    label: "app_blog_admin.app.pages.edit.label" satisfies BlogAdminAllKeys,
    icon: <FileText />,
    Page: (props) => <BlogEditPage appId={props.appId} />,
    pageBreadcrumbs: [
      blogBreadcrumb,
      {
        title: "app_blog_admin.app.pages.edit.label" satisfies BlogAdminAllKeys,
        link: "/dashboard/blog/edit",
      },
    ],
    pageTitle: "app_blog_admin.app.pages.edit.title" satisfies BlogAdminAllKeys,
    pageDescription:
      "app_blog_admin.app.pages.edit.description" satisfies BlogAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
];
