"use client";

import { useI18n } from "@hacado/i18n/client";
import { AlertModal, Button, Spinner, toastPromise } from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { Trash } from "lucide-react";
import React from "react";
import { deleteSelectedAppointmentNotifications } from "../actions";
import { AppointmentNotification } from "../models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "../translations/types";

export const DeleteSelectedAppointmentNotificationsButton: React.FC<{
  appId: string;
  selected: AppointmentNotification[];
}> = ({ selected, appId }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);
  const tAdmin = useI18n("admin");

  const { reload } = useReload();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        deleteSelectedAppointmentNotifications(
          appId,
          selected.map((r) => r._id),
        ),
        {
          success: t("statusText.appointment_notifications_deleted", {
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
        aria-label={t("table.deleteSelected.label", {
          count: selected.length,
        })}
      >
        {isLoading && <Spinner />}
        <Trash className="h-4 w-4" />
        <span className="max-md:hidden">
          {t("table.deleteSelected.label", {
            count: selected.length,
          })}
        </span>
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
