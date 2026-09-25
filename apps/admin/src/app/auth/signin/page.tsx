import { AuthLayout } from "@/components/admin/auth/layout";
import { UserAuthForm } from "@/components/admin/auth/user-auth-form";
import { preferredWebsitePackHref } from "@/components/install/constants";
import { RememberWebsitePack } from "@/components/install/remember-website-pack";
import { getEnabledSocialAuthProviders } from "@/lib/auth/social-auth-providers";
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

export default async function AuthenticationPage(props: {
  searchParams: Promise<{ callbackUrl?: string; template?: string }>;
}) {
  const logger = getLoggerFactory("AdminPages")("signin");
  const searchParams = await props.searchParams;
  const templatePackId = searchParams.template?.trim() || "";

  logger.debug("Loading signin page");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const u = session.user as { organizationInstalled?: boolean };
    if (u.organizationInstalled) {
      redirect("/dashboard");
    }
    redirect(
      templatePackId
        ? preferredWebsitePackHref("/checkout", templatePackId)
        : searchParams.callbackUrl || "/checkout",
    );
  }

  const t = await getI18nAsync("admin");
  const enabledSocialProviders = getEnabledSocialAuthProviders();

  logger.debug("Signin page loaded");

  return (
    <AuthLayout
      title={t("auth.signIn")}
      description={t("auth.signInDescription")}
    >
      <RememberWebsitePack packId={templatePackId || null} />
      <UserAuthForm enabledSocialProviders={enabledSocialProviders} />
    </AuthLayout>
  );
}
