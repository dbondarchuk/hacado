"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Template } from "@hacado/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const DeleteSelectedTemplatesButton: React.FC<{
  selected: Template[];
}> = ({ selected }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        adminApi.templates.deleteTemplates(selected.map((page) => page._id)),
        {
          success: t("templates.table.deleteSelected.success"),
          error: t("templates.table.deleteSelected.error"),
        },
      );

      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          aria-label={t("templates.table.deleteSelected.button", {
            count: selected.length,
          })}
          disabled={isLoading || !selected || !selected.length}
        >
          {isLoading && <Spinner />}
          <Trash className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("templates.table.deleteSelected.button", {
              count: selected.length,
            })}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("templates.table.deleteSelected.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("templates.table.deleteSelected.confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("templates.table.deleteSelected.cancel")}
          </AlertDialogCancel>
          <Button onClick={action} variant="default">
            {isLoading && <Spinner />}
            <span>{t("templates.table.deleteSelected.deleteSelected")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
