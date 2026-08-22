import { getSession } from "@/app/utils";
import { CompleteProfileForm } from "@/components/admin/auth/complete-profile-form";
import { AuthLayout } from "@/components/admin/auth/layout";
import { userRequiresProfileCompletion } from "@/lib/auth/requires-profile-completion";
import { getI18nAsync } from "@hacado/i18n/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("auth.completeProfile.title"),
  };
}

export default async function CompleteProfilePage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const searchParams = await props.searchParams;
  const nextPath = searchParams.next?.startsWith("/")
    ? searchParams.next
    : "/checkout";

  const session = await getSession();
  if (!session) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/auth/complete-profile?next=${encodeURIComponent(nextPath)}`)}`,
    );
  }

  const needsProfile = await userRequiresProfileCompletion(session.user);
  if (!needsProfile) {
    redirect(nextPath);
  }

  const t = await getI18nAsync("admin");

  return (
    <AuthLayout
      title={t("auth.completeProfile.title")}
      description={t("auth.completeProfile.description")}
    >
      <CompleteProfileForm
        defaultName={session.user.name ?? ""}
        nextPath={nextPath}
      />
    </AuthLayout>
  );
}
