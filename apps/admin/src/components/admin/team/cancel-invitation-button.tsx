"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Button, toastPromise } from "@hacado/ui";
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
              const result =
                await adminApi.teams.cancelInvitation(invitationId);
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
