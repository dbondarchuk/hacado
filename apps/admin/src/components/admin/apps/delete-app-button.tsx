"use client";

import { appsApi } from "@hacado/api-sdk/admin/apps";
import { AdminApiError } from "@hacado/api-sdk/admin/utils";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { resolvedI18nText } from "@hacado/ui-admin/hooks";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@hacado/ui/alert-dialog";
import { Button } from "@hacado/ui/button";
import { useTimeZone } from "@hacado/ui/context";
import { toast } from "@hacado/ui/sonner";
import { Spinner } from "@hacado/ui/spinner";
import { Unplug } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export type DeleteAppButtonProps = {
  appId: string;
  children: React.ReactNode;
};

export const DeleteAppButton: React.FC<DeleteAppButtonProps> = ({
  appId,
  children,
}) => {
  const router = useRouter();
  const t = useI18n("apps");
  const tAll = useI18n();
  const timeZone = useTimeZone();
  const locale = useLocale();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const disconnectApp = async () => {
    setIsLoading(true);
    try {
      await appsApi.deleteApp(appId);

      toast.success(t("common.disconnect.toast.success"));
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      if (error.status === 405 && error instanceof AdminApiError) {
        const result = await error.response.json();
        let errorMessage = t(
          "common.disconnect.toast.error.defaultDescription",
        );

        if (result.error) {
          errorMessage = resolvedI18nText(result.error, tAll, timeZone, locale);
        }

        toast.error(t("common.disconnect.toast.error.title"), {
          description: errorMessage,
        });

        return;
      }

      toast.error(t("common.disconnect.toast.error.title"), {
        description: t("common.disconnect.toast.error.defaultDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("common.disconnect.confirmationDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("common.disconnect.confirmationDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("common.disconnect.confirmationDialog.cancel")}
          </AlertDialogCancel>
          <Button
            disabled={isLoading}
            variant="destructive"
            onClick={disconnectApp}
            className="flex flex-row gap-1 items-center"
          >
            {isLoading ? <Spinner /> : <Unplug />}{" "}
            <span>{t("common.disconnect.label")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
