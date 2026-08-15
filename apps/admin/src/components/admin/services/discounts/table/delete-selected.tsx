"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Discount } from "@hacado/types";
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

export const DeleteSelectedDiscountsButton: React.FC<{
  selected: Discount[];
}> = ({ selected }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        adminApi.discounts.deleteDiscounts(selected.map((page) => page._id)),
        {
          success: t("services.discounts.deleteSelected.success", {
            count: selected.length,
          }),
          error: t("services.discounts.deleteSelected.error"),
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
          aria-label={t("services.discounts.deleteSelected.button", {
            count: selected.length,
          })}
          disabled={isLoading || !selected || !selected.length}
        >
          {isLoading && <Spinner />}
          <Trash className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("services.discounts.deleteSelected.button", {
              count: selected.length,
            })}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("services.discounts.deleteSelected.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p>{t("services.discounts.deleteSelected.confirmDescription")}</p>
            <p>{t("services.discounts.deleteSelected.confirmDescription2")}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("services.discounts.deleteSelected.cancel")}
          </AlertDialogCancel>
          <Button onClick={action} variant="default">
            {isLoading && <Spinner />}
            <span>{t("services.discounts.deleteSelected.deleteSelected")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
