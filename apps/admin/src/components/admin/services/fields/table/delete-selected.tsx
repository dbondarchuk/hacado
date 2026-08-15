"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { ServiceField } from "@hacado/types";
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

export const DeleteSelectedFieldsButton: React.FC<{
  selected: ServiceField[];
}> = ({ selected }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        adminApi.serviceFields.deleteServiceFields(
          selected.map((page) => page._id),
        ),
        {
          success: t("services.fields.deleteSelected.success", {
            count: selected.length,
          }),
          error: t("services.fields.deleteSelected.error"),
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
          disabled={isLoading || !selected || !selected.length}
          aria-label={t("services.fields.deleteSelected.button", {
            count: selected.length,
          })}
        >
          {isLoading && <Spinner />}
          <Trash className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("services.fields.deleteSelected.button", {
              count: selected.length,
            })}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("services.fields.deleteSelected.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("services.fields.deleteSelected.confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("services.fields.deleteSelected.cancel")}
          </AlertDialogCancel>
          <Button onClick={action} variant="default">
            {isLoading && <Spinner />}
            <span>{t("services.fields.deleteSelected.deleteSelected")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
