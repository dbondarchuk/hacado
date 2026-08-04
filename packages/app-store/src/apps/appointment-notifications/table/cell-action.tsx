"use client";
import { useI18n } from "@timelish/i18n/client";
import {
  AlertModal,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toastPromise,
} from "@timelish/ui";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useReload } from "@timelish/ui-admin";
import { deleteAppointmentNotification } from "../actions";
import { AppointmentNotification } from "../models";
import {
  AppointmentNotificationsAdminKeys,
  appointmentNotificationsAdminNamespace,
  AppointmentNotificationsAdminNamespace,
} from "../translations/types";

interface CellActionProps {
  appointmentNotification: AppointmentNotification;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({
  appointmentNotification,
  appId,
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);

  const tAdmin = useI18n("admin");

  const { reload } = useReload();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(
        deleteAppointmentNotification(appId, appointmentNotification._id),
        {
          success: t("statusText.appointment_notification_deleted"),
          error: tAdmin("common.toasts.error"),
        },
      );

      setOpen(false);
      reload();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{tAdmin("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("table.actions.label")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/communications/appointment-notifications/edit?id=${appointmentNotification._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" /> {t("table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/communications/appointment-notifications/new?from=${appointmentNotification._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" /> {t("table.actions.clone")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="size-3.5" /> {t("table.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
