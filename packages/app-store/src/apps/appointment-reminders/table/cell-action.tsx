"use client";
import { useI18n } from "@hacado/i18n/client";
import { AlertModal } from "@hacado/ui/alert-modal";
import { Button } from "@hacado/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { toastPromise } from "@hacado/ui/sonner";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useReload } from "@hacado/ui-admin/hooks";
import { deleteAppointmentReminder } from "../actions";
import { AppointmentReminder } from "../models";
import {
  AppointmentRemindersAdminKeys,
  appointmentRemindersAdminNamespace,
  AppointmentRemindersAdminNamespace,
} from "../translations/types";

interface CellActionProps {
  appointmentReminder: AppointmentReminder;
  appId: string;
}

export const CellAction: React.FC<CellActionProps> = ({
  appointmentReminder,
  appId,
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const tAdmin = useI18n("admin");

  const { reload } = useReload();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(
        deleteAppointmentReminder(appId, appointmentReminder._id),
        {
          success: t("statusText.appointment_reminder_deleted"),
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
              href={`/dashboard/communications/appointment-reminders/edit?id=${appointmentReminder._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" /> {t("table.actions.edit")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/communications/appointment-reminders/new?from=${appointmentReminder._id}`}
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
