import { AuthErrorContent } from "@/components/admin/auth/auth-error-content";
import { AuthLayout } from "@/components/admin/auth/layout";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("auth.error.title"),
  };
}

export default async function AuthErrorPage() {
  const logger = getLoggerFactory("AdminPages")("auth-error");
  logger.debug("Loading auth error page");

  const t = await getI18nAsync("admin");

  return (
    <AuthLayout
      title={t("auth.error.title")}
      description={t("auth.error.description")}
    >
      <AuthErrorContent />
    </AuthLayout>
  );
}
