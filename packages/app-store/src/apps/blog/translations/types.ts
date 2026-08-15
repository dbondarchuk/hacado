import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type BlogAdminKeys = Leaves<typeof adminKeys>;
export const blogAdminNamespace = "app_blog_admin" as const;

export type BlogAdminNamespace = typeof blogAdminNamespace;

export type BlogPublicKeys = Leaves<typeof publicKeys>;
export const blogPublicNamespace = "app_blog_public" as const;

export type BlogPublicNamespace = typeof blogPublicNamespace;

export type BlogAdminAllKeys = AllKeys<BlogAdminNamespace, BlogAdminKeys>;

export type BlogPublicAllKeys = AllKeys<BlogPublicNamespace, BlogPublicKeys>;
