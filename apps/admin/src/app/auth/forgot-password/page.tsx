import { AuthLayout } from "@/components/admin/auth/layout";
import { UserForgotPasswordForm } from "@/components/admin/auth/user-forgot-password-form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("auth.forgotPassword.title"),
  };
}

export default async function AuthenticationPage() {
  const logger = getLoggerFactory("AdminPages")("forgot-password");

  logger.debug("Loading forgot-password page");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const t = await getI18nAsync("admin");

  logger.debug("Forgot-password page loaded");

  return (
    <AuthLayout
      title={t("auth.forgotPassword.title")}
      description={t("auth.forgotPassword.description")}
    >
      <UserForgotPasswordForm
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? ""}
      />
    </AuthLayout>
  );
}
