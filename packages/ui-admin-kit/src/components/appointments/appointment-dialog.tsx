"use client";

import { useI18n } from "@hacado/i18n/client";
import { Appointment } from "@hacado/types/booking";
import { Button } from "@hacado/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@hacado/ui/dialog";
import { DialogProps } from "@radix-ui/react-dialog";
import React from "react";
import { AppointmentView, AppointmentViewProvider } from "./appointment-view";

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
        <DialogContent className="flex h-full max-h-[100%] flex-col sm:max-w-[80%]">
          <DialogTitle className="sr-only">
            {appointment.service.name}
          </DialogTitle>
          <div className="min-h-0 w-full flex-1 overflow-y-auto">
            <AppointmentView layout="page" showOpenFullPage />
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
