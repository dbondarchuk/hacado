"use client";

import { teamsApi } from "@hacado/api-sdk/admin/teams";
import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { toastPromise } from "@hacado/ui/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelInvitationButton({
  invitationId,
}: {
  invitationId: string;
}) {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await toastPromise(
            (async () => {
              const result = await teamsApi.cancelInvitation(invitationId);
              if (!result.ok) throw new Error(result.code);
              return result;
            })(),
            {
              success: t("team.cancelInvite"),
              error: t("common.toasts.error"),
            },
          );
          router.refresh();
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }}
    >
      {t("team.cancelInvite")}
    </Button>
  );
}
