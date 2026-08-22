import { getPublicInvitation } from "@/app/accept-invitation/actions";
import { AuthLayout } from "@/components/admin/auth/layout";
import { UserSignupForm } from "@/components/admin/auth/user-signup-form";
import { isPublicSignupAllowedFromHeaders } from "@/lib/auth/signup-geo";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Link } from "@hacado/ui";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("auth.signUp.title"),
  };
}

export default async function SignupPage(props: {
  searchParams: Promise<{ invitationId?: string; callbackUrl?: string }>;
}) {
  const logger = getLoggerFactory("AdminPages")("signup");
  const publicDomain = process.env.PUBLIC_DOMAIN!;
  const searchParams = await props.searchParams;
  const invitationId = searchParams.invitationId || "";

  logger.debug("Loading signup page");

  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session) {
    if (invitationId) {
      redirect(
        `/accept-invitation?invitationId=${encodeURIComponent(invitationId)}`,
      );
    }
    const u = session.user as { organizationInstalled?: boolean };
    redirect(u.organizationInstalled ? "/dashboard" : "/checkout");
  }

  const t = await getI18nAsync("admin");

  let invitation: {
    id: string;
    email: string;
    organizationName: string;
  } | null = null;

  if (invitationId) {
    const result = await getPublicInvitation(invitationId);
    if (result.ok) {
      invitation = {
        id: result.invitation.id,
        email: result.invitation.email,
        organizationName: result.invitation.organizationName,
      };
    }
  }

  const description = invitation
    ? t("team.acceptInvitation.description", {
        organizationName: invitation.organizationName,
      })
    : t("auth.signUp.description");

  const regionAllowed =
    !!invitation ||
    isPublicSignupAllowedFromHeaders(requestHeaders, "signup-page");

  if (invitation) {
    logger.info(
      { invitationId: invitation.id },
      "Signup page allowed: valid invitation",
    );
  }

  logger.debug(
    { regionAllowed, hasInvitation: !!invitation },
    "Signup page loaded",
  );

  if (!regionAllowed) {
    logger.warn("Signup page blocked: region not allowed");
    return (
      <AuthLayout
        title={t("auth.signUp.regionBlocked.title")}
        description={t("auth.signUp.regionBlocked.description")}
      >
        <div className="text-center w-full text-base">
          <Link
            href="/auth/signin"
            className="ml-auto w-full"
            variant="underline"
          >
            {t("auth.signIn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.signUp.title")} description={description}>
      <UserSignupForm
        publicDomain={publicDomain}
        invitation={invitation}
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? ""}
        googleAuthEnabled={Boolean(
          process.env.GOOGLE_AUTH_CLIENT_ID &&
            process.env.GOOGLE_AUTH_CLIENT_SECRET,
        )}
      />
    </AuthLayout>
  );
}
