"use client";

import { useI18n } from "@hacado/i18n/client";
import { useReload } from "@hacado/ui-admin/hooks";
import { AlertModal } from "@hacado/ui/alert-modal";
import { Button } from "@hacado/ui/button";
import { toastPromise } from "@hacado/ui/sonner";
import { Spinner } from "@hacado/ui/spinner";
import { Trash } from "lucide-react";
import React from "react";
import { deleteSelectedAppointmentReminders } from "../actions";
import { AppointmentReminder } from "../models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "../translations/types";

export const DeleteSelectedAppointmentRemindersButton: React.FC<{
  appId: string;
  selected: AppointmentReminder[];
}> = ({ selected, appId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const tAdmin = useI18n("admin");
  const tUi = useI18n("ui");

  const { reload } = useReload();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        deleteSelectedAppointmentReminders(
          appId,
          selected.map((r) => r._id),
        ),
        {
          success: t("statusText.appointment_reminders_deleted", {
            count: selected.length,
          }),
          error: tAdmin("common.toasts.error"),
        },
      );

      reload();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        disabled={isLoading || !selected || !selected.length}
        onClick={() => setIsOpen(true)}
        aria-label={tUi("actions.delete")}
      >
        {isLoading && <Spinner />}
        <Trash className="h-4 w-4" />
        <span>{tUi("actions.delete")}</span>
      </Button>
      <AlertModal
        isOpen={isOpen}
        loading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={action}
        description={t("table.deleteSelected.description", {
          count: selected.length,
        })}
      />
    </>
  );
};
