import { getPublicInvitation } from "@/app/accept-invitation/actions";
import { auth } from "@/app/auth";
import { AcceptInvitationForm } from "@/components/admin/auth/accept-invitation-form";
import { AuthLayout } from "@/components/admin/auth/layout";
import { getI18nAsync } from "@hacado/i18n/server";
import { MEMBERS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("team.acceptInvitation.title"),
  };
}

export default async function AcceptInvitationPage(props: {
  searchParams: Promise<{ invitationId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const invitationId = searchParams.invitationId || "";
  const t = await getI18nAsync("admin");

  const result = await getPublicInvitation(invitationId);
  if (!result.ok) {
    const message =
      result.error === "missing"
        ? t("team.acceptInvitation.missing")
        : t("team.acceptInvitation.invalid");
    return (
      <AuthLayout
        title={t("team.acceptInvitation.title")}
        description={message}
      >
        <div />
      </AuthLayout>
    );
  }

  const { invitation } = result;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect(`/auth/signup?invitationId=${encodeURIComponent(invitation.id)}`);
  }

  const db = await getDbConnection();
  const existingMember = await db.collection(MEMBERS_COLLECTION_NAME).findOne({
    organizationId: invitation.organizationId,
    userId: session.user.id,
    status: "active",
  });
  if (existingMember) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout
      title={t("team.acceptInvitation.title")}
      description={t("team.acceptInvitation.descriptionLoggedIn", {
        organizationName: invitation.organizationName,
      })}
    >
      <AcceptInvitationForm
        invitation={invitation}
        sessionEmail={session.user.email}
      />
    </AuthLayout>
  );
}
