import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { FileText } from "lucide-react";
import { BlogAdminKeys, BlogAdminNamespace } from "./translations/types";

export const BlogQuickLinkInjector: DashboardQuickLinkInjectorApp<
  BlogAdminNamespace,
  BlogAdminKeys
> = {
  items: [
    {
      id: "blog-write-post",
      order: 120,
      href: "/dashboard/blog/new",
      label: "app_blog_admin.quickLinks.writePost",
      icon: <FileText className="size-4" strokeWidth={1.5} />,
      requiredPermission: { resource: "page", action: "update" },
    },
  ],
};
