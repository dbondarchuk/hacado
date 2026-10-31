import type {
  PrefixedKeys as BlogAdminAllKeys,
  Keys as BlogAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as BlogPublicAllKeys,
  Keys as BlogPublicKeys,
} from "./en/public.keys";

export type {
  BlogAdminAllKeys,
  BlogAdminKeys,
  BlogPublicAllKeys,
  BlogPublicKeys,
};

export const blogAdminNamespace = "app_blog_admin" as const;

export type BlogAdminNamespace = typeof blogAdminNamespace;

export const blogPublicNamespace = "app_blog_public" as const;

export type BlogPublicNamespace = typeof blogPublicNamespace;
