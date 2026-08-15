import { AuthLayout } from "@/components/admin/auth/layout";
import { UserAuthForm } from "@/components/admin/auth/user-auth-form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("auth.signIn"),
  };
}

export default async function AuthenticationPage() {
  const logger = getLoggerFactory("AdminPages")("signin");

  logger.debug("Loading signin page");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const t = await getI18nAsync("admin");

  logger.debug("Signin page loaded");

  return (
    <AuthLayout
      title={t("auth.signIn")}
      description={t("auth.signInDescription")}
    >
      <UserAuthForm />
    </AuthLayout>
  );
}
