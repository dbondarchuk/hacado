"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";

import {
  Appointment,
  AppointmentStatus,
  isClosedAppointmentStatus,
} from "@hacado/types/booking";
import { useAuth } from "@hacado/ui-admin/context";
import { CustomerName } from "@hacado/ui-admin/data-table";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Button } from "@hacado/ui/button";
import { ButtonGroup } from "@hacado/ui/button-group";
import { useTimeZone } from "@hacado/ui/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { use12HourFormat } from "@hacado/ui/hooks";
import { Link } from "@hacado/ui/link";
import {
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@hacado/ui/tabs";
import { canUpdateAppointment } from "@hacado/utils/permissions";
import {
  CalendarCheck2,
  CalendarCog,
  CalendarSearch,
  CalendarSync,
  CalendarX2,
  MoreHorizontal,
  Send,
  SquareArrowOutUpRight,
} from "lucide-react";
import { DateTime } from "luxon";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { RecentCommunications } from "../communications/communications";
import { SendCommunicationDialog } from "../communications/send-message-dialog";
import { AppointmentActionButton, changeStatus } from "./action-button";
import { AppointmentDeclineDialog } from "./appointment-decline-dialog";
import { AppointmentRescheduleDialog } from "./appointment-reschedule-dialog";
import { APPOINTMENT_STATUS_STYLES } from "./const";
import { AppointmentViewContext } from "./context";
import { SubscriptionPastDueDialog } from "./subscription-past-due-dialog";
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

export function AppointmentIdentityHeader({
  appointment,
  showOpenFullPage = false,
}: {
  appointment: Appointment;
  showOpenFullPage?: boolean;
}) {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();
  const uses12HourFormat = use12HourFormat();

  const start = DateTime.fromJSDate(appointment.dateTime, { zone: timeZone });
  const end = start.plus({ minutes: appointment.totalDuration });
  const dateLabel = start.toLocaleString(DateTime.DATE_MED, { locale });
  const timeLabel = `${start.toFormat(uses12HourFormat ? "h:mm a" : "HH:mm", { locale })} – ${end.toFormat(uses12HourFormat ? "h:mm a" : "HH:mm", { locale })}`;

  const title = (
    <span className="block truncate text-base font-medium leading-tight">
      {appointment.service.name}
    </span>
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {showOpenFullPage ? (
            <Link
              href={`/dashboard/appointments/${appointment._id}`}
              variant="underline"
              title={t("appointments.dialog.viewFullInfo")}
              className="inline-flex min-w-0 items-center gap-1 text-foreground"
            >
              {title}
              <SquareArrowOutUpRight className="size-3.5 shrink-0" />
            </Link>
          ) : (
            title
          )}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${APPOINTMENT_STATUS_STYLES[appointment.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {t(`appointments.status.${appointment.status}`)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground md:text-sm">
          <Link
            href={`/dashboard/customers/${appointment.customerId}`}
            variant="underline"
            className="text-inherit"
          >
            <CustomerName customer={appointment.customer} />
          </Link>
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          <span>
            {dateLabel} · {timeLabel}
          </span>
        </p>
      </div>
    </div>
  );
}

export const AppointmentViewButtons: React.FC<{
  /** On mobile, collapse all actions into a single "…" menu. */
  compactOnMobile?: boolean;
}> = ({ compactOnMobile = false }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const { appointment, setAppointment, setKey } = React.useContext(
    AppointmentViewContext,
  );

  const canUpdate = canUpdateAppointment(user, appointment.memberId);
  const isOpen = !isClosedAppointmentStatus(appointment.status);

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

  const router = useRouter();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = React.useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] =
    React.useState(false);

  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [isPastDueDialogOpen, setIsPastDueDialogOpen] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);

  const confirmAppointment = () => {
    void changeStatus(
      appointment._id,
      "confirmed",
      t,
      setIsConfirming,
      router.refresh,
      updateStatus,
      undefined,
      undefined,
      () => setIsPastDueDialogOpen(true),
    );
  };

  const dialogs = (
    <>
      {canUpdate ? (
        <>
          <SendCommunicationDialog
            appointmentId={appointment._id}
            open={isSendDialogOpen}
            onOpenChange={setIsSendDialogOpen}
            onSuccess={() => setKey(new Date().getTime().toString())}
          />
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
            onOpenChange={setIsRescheduleDialogOpen}
          />
          <SubscriptionPastDueDialog
            open={isPastDueDialogOpen}
            onOpenChange={setIsPastDueDialogOpen}
          />
        </>
      ) : null}
    </>
  );

  const moreMenuItems = (
    <>
      {canUpdate && isOpen && appointment.status === "pending" ? (
        <DropdownMenuItem
          disabled={isConfirming}
          onClick={confirmAppointment}
          className="relative bg-gradient-primary dark:bg-gradient-dark text-primary-foreground z-[1] before:absolute before:inset-0 before:bg-background before:z-[-1] before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:rounded-md before:bg-gradient-dark before:dark:bg-gradient-accent"
        >
          <CalendarCheck2 size={16} />
          {t("appointments.view.confirm")}
        </DropdownMenuItem>
      ) : null}
      {canUpdate && isOpen ? (
        <DropdownMenuItem onClick={() => setIsRescheduleDialogOpen(true)}>
          <CalendarSearch size={16} />
          {t("appointments.view.reschedule")}
        </DropdownMenuItem>
      ) : null}
      {isOpen ? (
        <DropdownMenuItem asChild>
          <NextLink
            className="inline-flex w-full flex-row items-center gap-2"
            href={`/dashboard/appointments/new?from=${appointment._id}`}
          >
            <CalendarSync size={16} />
            {t("appointments.view.scheduleAgain")}
          </NextLink>
        </DropdownMenuItem>
      ) : null}
      {canUpdate && isOpen ? (
        <DropdownMenuItem asChild>
          <NextLink
            className="inline-flex w-full flex-row items-center gap-2"
            href={`/dashboard/appointments/${appointment._id}/edit`}
          >
            <CalendarCog size={16} />
            {t("appointments.view.edit")}
          </NextLink>
        </DropdownMenuItem>
      ) : null}
      {canUpdate && isOpen ? (
        <DropdownMenuItem
          onClick={() => setIsDeclineDialogOpen(true)}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground focus:bg-destructive/90 focus:text-destructive-foreground"
        >
          <CalendarX2 size={16} />
          {t("appointments.view.decline")}
        </DropdownMenuItem>
      ) : null}
      {canUpdate ? (
        <DropdownMenuItem onClick={() => setIsSendDialogOpen(true)}>
          <Send size={16} />
          {t("appointments.view.sendMessage")}
        </DropdownMenuItem>
      ) : null}
    </>
  );

  const hasAnyAction = canUpdate || (!canUpdate && isOpen);

  if (!hasAnyAction) {
    return dialogs;
  }

  const desktopActions = (
    <div className="flex flex-row flex-nowrap items-center justify-end gap-2 [&>form]:hidden">
      {canUpdate ? (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setIsSendDialogOpen(true)}
        >
          <Send /> {t("appointments.view.sendMessage")}
        </Button>
      ) : null}

      {canUpdate && isOpen ? (
        <ButtonGroup>
          {appointment.status === "pending" ? (
            <AppointmentActionButton
              variant="default"
              size="sm"
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
              size="sm"
              className="inline-flex flex-row items-center gap-2"
              onClick={() => setIsRescheduleDialogOpen(true)}
            >
              <CalendarSearch size={16} />
              {t("appointments.view.reschedule")}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  appointment.status === "pending" ? "default" : "outline"
                }
                size="sm"
                className="inline-flex flex-row items-center gap-2"
                aria-label={t("common.buttons.more")}
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <NextLink
                  className="inline-flex w-full flex-row items-center gap-2"
                  href={`/dashboard/appointments/new?from=${appointment._id}`}
                >
                  <CalendarSync size={16} />{" "}
                  {t("appointments.view.scheduleAgain")}
                </NextLink>
              </DropdownMenuItem>
              {appointment.status === "pending" ? (
                <DropdownMenuItem
                  onClick={() => setIsRescheduleDialogOpen(true)}
                >
                  <CalendarSearch size={16} />
                  {t("appointments.view.reschedule")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <NextLink
                  className="inline-flex w-full flex-row items-center gap-2"
                  href={`/dashboard/appointments/${appointment._id}/edit`}
                >
                  <CalendarCog size={16} /> {t("appointments.view.edit")}
                </NextLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeclineDialogOpen(true)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground focus:bg-destructive/90 focus:text-destructive-foreground"
              >
                <CalendarX2 size={16} />
                {t("appointments.view.decline")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      ) : !canUpdate && isOpen ? (
        <Button variant="outline" size="sm" asChild>
          <NextLink
            className="inline-flex flex-row items-center gap-2"
            href={`/dashboard/appointments/new?from=${appointment._id}`}
          >
            <CalendarSync size={16} /> {t("appointments.view.scheduleAgain")}
          </NextLink>
        </Button>
      ) : null}
    </div>
  );

  if (!compactOnMobile) {
    return (
      <>
        {dialogs}
        {desktopActions}
      </>
    );
  }

  return (
    <>
      {dialogs}
      <div className="hidden md:block">{desktopActions}</div>
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label={t("common.buttons.more")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {moreMenuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export const AppointmentView: React.FC<{
  view?: View;
  layout?: "page" | "embedded";
  showOpenFullPage?: boolean;
}> = ({ view, layout = "embedded", showOpenFullPage = false }) => {
  const t = useI18n("admin");

  const params = useSearchParams();
  const defaultView = view ?? params.get("view") ?? "details";

  const { appointment, key } = React.useContext(AppointmentViewContext);

  const tabTriggers = (
    <>
      <TabsTrigger value="details">
        {t("appointments.view.details")}
      </TabsTrigger>
      <TabsTrigger value="payments">
        {t("appointments.view.payments")}
      </TabsTrigger>
      <TabsTrigger value="files">{t("appointments.view.files")}</TabsTrigger>
      <TabsTrigger value="communications">
        {t("appointments.view.communications")}
      </TabsTrigger>
      <TabsTrigger value="history">
        {t("appointments.view.history")}
      </TabsTrigger>
    </>
  );

  return (
    <div className="flex w-full @container [contain:layout] flex-col gap-4">
      <Tabs
        defaultValue={defaultView}
        className="mb-4 flex min-w-0 flex-col gap-4"
      >
        {layout === "page" ? (
          <div className="flex flex-col gap-0.5">
            <PageHeader
              className="mb-0 border-b-0"
              text={
                <div className="my-2 w-full min-w-0">
                  <AppointmentIdentityHeader
                    appointment={appointment}
                    showOpenFullPage={showOpenFullPage}
                  />
                </div>
              }
              actions={
                <div className="flex justify-end py-2">
                  <AppointmentViewButtons compactOnMobile />
                </div>
              }
            />
            <PageHeader
              className="-mt-2"
              actions={
                <ResponsiveTabsList
                  variant="line"
                  className="min-w-0 w-full border-b-0 py-2"
                >
                  {tabTriggers}
                </ResponsiveTabsList>
              }
            />
          </div>
        ) : (
          <ResponsiveTabsList className="flex w-full flex-row gap-2">
            {tabTriggers}
          </ResponsiveTabsList>
        )}
        <TabsContent value="details" className="mt-0">
          <AppointmentDetails appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="payments" className="mt-0">
          <PaymentsTab appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="files" className="mt-0">
          <AppointmentFiles appointment={appointment} key={key} />
        </TabsContent>
        <TabsContent value="communications" className="mt-0">
          <RecentCommunications appointmentId={appointment._id} key={key} />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <AppointmentHistory appointmentId={appointment._id} key={key} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
