"use client";

import { DialogProps } from "@radix-ui/react-dialog";
import { useI18n } from "@hacado/i18n/client";
import { Appointment } from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Link,
} from "@hacado/ui";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import {
  AppointmentView,
  AppointmentViewButtons,
  AppointmentViewProvider,
} from "./appointment-view";

export type AppointmentDialogProps = DialogProps & {
  appointment: Appointment;
};

export const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  appointment,
  ...rest
}) => {
  const t = useI18n("admin");

  return (
    <Dialog {...rest}>
      <AppointmentViewProvider appointment={appointment}>
        <DialogContent className="sm:max-w-[80%] flex flex-col h-full max-h-[100%]">
          <DialogHeader className="flex flex-row justify-between items-center">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
                <Link
                  variant="underline"
                  title={t("appointments.dialog.viewFullInfo")}
                  href={`/dashboard/appointments/${appointment._id}`}
                  className="inline"
                >
                  {appointment.option.name}
                  <SquareArrowOutUpRight className="size-3.5 inline-block ml-1" />
                </Link>
              </DialogTitle>
              <DialogDescription>
                {t("appointments.dialog.by")} {appointment.fields.name}
              </DialogDescription>
            </div>
            <AppointmentViewButtons />
          </DialogHeader>
          <div className="flex-1 w-full overflow-y-auto">
            <AppointmentView />
          </div>
          <DialogFooter className="flex-row gap-2">
            <DialogClose asChild>
              <Button variant="secondary">{t("common.buttons.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </AppointmentViewProvider>
    </Dialog>
  );
};
