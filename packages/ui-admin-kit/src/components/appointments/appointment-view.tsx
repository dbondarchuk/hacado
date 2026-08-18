"use client";

import { useI18n } from "@hacado/i18n/client";

import {
  Appointment,
  AppointmentStatus,
  isClosedAppointmentStatus,
} from "@hacado/types";
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@hacado/ui";
import { useAuth } from "@hacado/ui-admin";
import { canUpdateAppointment } from "@hacado/utils";
import {
  CalendarCheck2,
  CalendarCog,
  CalendarSearch,
  CalendarSync,
  CalendarX2,
  MoreHorizontal,
  Send,
} from "lucide-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { RecentCommunications } from "../communications/communications";
import { SendCommunicationDialog } from "../communications/send-message-dialog";
import { AppointmentActionButton } from "./action-button";
import { AppointmentDeclineDialog } from "./appointment-decline-dialog";
import { AppointmentRescheduleDialog } from "./appointment-reschedule-dialog";
import { AppointmentViewContext } from "./context";
import { AppointmentDetails } from "./tabs/details";
import { AppointmentFiles } from "./tabs/files";
import { AppointmentHistory } from "./tabs/history";
import { PaymentsTab } from "./tabs/payments";

const views = [
  "details",
  "payments",
  "files",
  "communications",
  "history",
] as const;
type View = (typeof views)[number];

export const AppointmentViewProvider: React.FC<{
  appointment: Appointment;
  children: React.ReactNode;
}> = ({ appointment: propAppointment, children }) => {
  const [appointment, setAppointment] = React.useState(propAppointment);
  const [key, setKey] = React.useState<string>(new Date().getTime().toString());
  return (
    <AppointmentViewContext.Provider
      value={{ appointment, setAppointment, key, setKey }}
    >
      {children}
    </AppointmentViewContext.Provider>
  );
};

export const AppointmentViewButtons: React.FC = () => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const { appointment, setAppointment, key, setKey } = React.useContext(
    AppointmentViewContext,
  );
  const canUpdate = canUpdateAppointment(user, appointment.memberId);
  const reschedule = ({
    dateTime,
    duration,
  }: {
    dateTime: Date;
    duration: number;
  }) => {
    setAppointment((prev) => ({
      ...prev,
      dateTime,
      totalDuration: duration,
    }));

    setKey(new Date().getTime().toString());
  };

  const updateStatus = (newStatus: AppointmentStatus) => {
    setAppointment((prev) => ({
      ...prev,
      status: newStatus,
    }));

    setKey(new Date().getTime().toString());
  };

  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = React.useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] =
    React.useState(false);

  return (
    <div className="flex flex-row justify-end gap-2 flex-wrap [&>form]:hidden">
      {canUpdate ? (
        <SendCommunicationDialog
          appointmentId={appointment._id}
          onSuccess={() => setKey(new Date().getTime().toString())}
        >
          <Button variant="secondary">
            <Send /> {t("appointments.view.sendMessage")}
          </Button>
        </SendCommunicationDialog>
      ) : null}

      {canUpdate ? (
        <>
          <AppointmentDeclineDialog
            appointment={appointment}
            onSuccess={updateStatus}
            open={isDeclineDialogOpen}
            onClose={() => setIsDeclineDialogOpen(false)}
          />
          <AppointmentRescheduleDialog
            appointment={appointment}
            onRescheduled={reschedule}
            open={isRescheduleDialogOpen}
            onOpenChange={(open) => setIsRescheduleDialogOpen(open)}
          />

          {!isClosedAppointmentStatus(appointment.status) ? (
            <ButtonGroup>
              {appointment.status === "pending" ? (
                <AppointmentActionButton
                  variant="default"
                  _id={appointment._id}
                  status="confirmed"
                  className="gap-2"
                  onSuccess={updateStatus}
                  icon={CalendarCheck2}
                >
                  {t("appointments.view.confirm")}
                </AppointmentActionButton>
              ) : (
                <Button
                  variant="outline"
                  className="inline-flex flex-row gap-2 items-center"
                  onClick={() => setIsRescheduleDialogOpen(true)}
                >
                  <CalendarSearch size={20} />
                  {t("appointments.view.reschedule")}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={
                      appointment.status === "pending" ? "default" : "outline"
                    }
                    className="inline-flex flex-row gap-2 items-center"
                    aria-label={t("common.buttons.more")}
                  >
                    <MoreHorizontal size={20} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <NextLink
                      className="inline-flex flex-row gap-2 items-center w-full"
                      href={`/dashboard/appointments/new?from=${appointment._id}`}
                    >
                      <CalendarSync size={20} />{" "}
                      {t("appointments.view.scheduleAgain")}
                    </NextLink>
                  </DropdownMenuItem>
                  {appointment.status === "pending" && (
                    <DropdownMenuItem
                      onClick={() => setIsRescheduleDialogOpen(true)}
                    >
                      <CalendarSearch size={20} />
                      {t("appointments.view.reschedule")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <NextLink
                      className="inline-flex flex-row gap-2 items-center w-full"
                      href={`/dashboard/appointments/${appointment._id}/edit`}
                    >
                      <CalendarCog size={20} /> {t("appointments.view.edit")}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeclineDialogOpen(true)}
                    className="text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:bg-destructive/90 hover:text-destructive-foreground focus:text-destructive-foreground"
                  >
                    <CalendarX2 size={20} />
                    {t("appointments.view.decline")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          ) : null}
        </>
      ) : !isClosedAppointmentStatus(appointment.status) ? (
        <Button variant="outline" asChild>
          <NextLink
            className="inline-flex flex-row gap-2 items-center"
            href={`/dashboard/appointments/new?from=${appointment._id}`}
          >
            <CalendarSync size={20} /> {t("appointments.view.scheduleAgain")}
          </NextLink>
        </Button>
      ) : null}
    </div>
  );
};

export const AppointmentView: React.FC<{
  view?: View;
}> = ({ view }) => {
  const t = useI18n("admin");

  const params = useSearchParams();
  const defaultView = view ?? params.get("view") ?? "details";

  const { appointment, key } = React.useContext(AppointmentViewContext);
  return (
    <div className="flex flex-col gap-4 w-full @container [contain:layout]">
      <Tabs defaultValue={defaultView} className="flex flex-col gap-2 mb-4">
        {/* <TabsList className="w-fit self-end"> */}
        <ResponsiveTabsList className="w-full flex flex-row gap-2">
          <TabsTrigger value="details">
            {t("appointments.view.details")}
          </TabsTrigger>
          <TabsTrigger value="payments">
            {t("appointments.view.payments")}
          </TabsTrigger>
          <TabsTrigger value="files">
            {t("appointments.view.files")}
          </TabsTrigger>
          <TabsTrigger value="communications">
            {t("appointments.view.communications")}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t("appointments.view.history")}
          </TabsTrigger>
        </ResponsiveTabsList>
        <TabsContent value="details">
          <AppointmentDetails appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="files">
          <AppointmentFiles appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="communications">
          <RecentCommunications appointmentId={appointment._id} key={key} />
        </TabsContent>
        <TabsContent value="history">
          <AppointmentHistory appointmentId={appointment._id} key={key} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
