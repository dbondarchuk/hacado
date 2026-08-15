"use client";

import type { PublicInvitation } from "@/app/accept-invitation/actions";
import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import { Button, Link, toast } from "@hacado/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AcceptInvitationFormProps = {
  invitation: PublicInvitation;
  sessionEmail: string;
};

export function AcceptInvitationForm({
  invitation,
  sessionEmail,
}: AcceptInvitationFormProps) {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const emailMatches =
    sessionEmail.toLowerCase() === invitation.email.toLowerCase();

  const onAccept = async () => {
    setLoading(true);
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });
      if (res.error) {
        toast.error(res.error.message || t("team.acceptInvitation.error"));
        return;
      }
      toast.success(t("team.acceptInvitation.success"));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (!emailMatches) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          {t("team.acceptInvitation.emailMismatch")}
        </p>
        <Link href="/auth/signin" variant="underline">
          {t("auth.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <Button
        disabled={loading}
        className="w-full"
        type="button"
        onClick={onAccept}
      >
        {t("team.acceptInvitation.submit")}
      </Button>
    </div>
  );
}
