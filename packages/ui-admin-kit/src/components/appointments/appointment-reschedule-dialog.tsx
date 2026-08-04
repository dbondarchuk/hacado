"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DialogProps } from "@radix-ui/react-dialog";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Appointment, CalendarEvent } from "@timelish/types";
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
  Checkbox,
  DateTimePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DurationInput,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Spinner,
  toastPromise,
  use12HourFormat,
  useTimeZone,
} from "@timelish/ui";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { AppointmentCalendar } from "./appointment-calendar";
import {
  isSubscriptionPastDueError,
  SubscriptionPastDueDialog,
} from "./subscription-past-due-dialog";

export type AppointmentRescheduleDialogProps = DialogProps & {
  appointment: Appointment;
  trigger?: React.ReactNode;
  onRescheduled?: (props: { dateTime: Date; duration: number }) => void;
};

const formSchema = z.object({
  dateTime: z.coerce.date<Date>({ error: "New date and time are required" }),
  duration: z.coerce
    .number<number>({ error: "New duration is required" })
    .int("Should be the integer value")
    .min(1, "Minimum duration is 1")
    .max(60 * 24 * 10, "Maximum duration is 10 days"),
  doNotNotifyCustomer: z.coerce.boolean<boolean>().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const AppointmentRescheduleDialog: React.FC<
  AppointmentRescheduleDialogProps
> = ({ appointment: propAppointment, trigger, onRescheduled, ...rest }) => {
  const t = useI18n("admin");
  const timeZone = useTimeZone();

  const [appointment, setAppointment] =
    React.useState<Appointment>(propAppointment);
  const uses12HourFormat = use12HourFormat();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    values: {
      dateTime: propAppointment.dateTime,
      duration: propAppointment.totalDuration,
      doNotNotifyCustomer: false,
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [confirmOverlap, setConfirmOverlap] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState(false);
  const [isPastDueDialogOpen, setIsPastDueDialogOpen] = React.useState(false);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>(
    [],
  );

  const isOpen = rest.open;

  React.useEffect(() => {
    setOpenDialog(!!isOpen);
  }, [isOpen]);

  const openCloseDialog = (open: boolean) => {
    setOpenDialog(open);
    rest.onOpenChange?.(open);
  };

  const router = useRouter();

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      await toastPromise(
        adminApi.appointments.reschedule(
          appointment._id,
          data.dateTime,
          data.duration,
          data.doNotNotifyCustomer,
        ),
        {
          success: t("appointments.rescheduleDialog.success"),
          error: t("appointments.rescheduleDialog.error"),
        },
      );

      router.refresh();
    } catch (error: any) {
      if (isSubscriptionPastDueError(error)) {
        setIsPastDueDialogOpen(true);
        return;
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isOverlaping = React.useMemo(() => {
    const appointmentStart = DateTime.fromJSDate(appointment.dateTime);
    const appointmentEnd = appointmentStart.plus({
      minutes: appointment.totalDuration,
    });

    return calendarEvents.some((app) => {
      if ((app as Appointment)._id === appointment._id) return false;
      const appStart = DateTime.fromJSDate(app.dateTime);
      const appEnd = appStart.plus({ minutes: app.totalDuration });

      return (
        (appStart >= appointmentStart && appStart <= appointmentEnd) ||
        (appointmentStart >= appStart && appointmentStart <= appEnd)
      );
    });
  }, [appointment, calendarEvents]);

  const { isValid } = useFormState(form);

  const dateTime = form.watch("dateTime");
  const duration = form.watch("duration");
  React.useEffect(() => {
    setAppointment((prev) => ({
      ...prev,
      dateTime,
      totalDuration: duration,
    }));

    setConfirmOverlap(false);
  }, [dateTime, duration, setAppointment, setConfirmOverlap]);

  const reschedule = async () => {
    if (isOverlaping && !confirmOverlap) return;

    await form.handleSubmit(onSubmit)();
    onRescheduled?.(form.getValues());

    setOpenConfirmDialog(false);
    openCloseDialog(false);
  };

  return (
    <Dialog {...rest} open={openDialog} onOpenChange={openCloseDialog}>
      <SubscriptionPastDueDialog
        open={isPastDueDialogOpen}
        onOpenChange={setIsPastDueDialogOpen}
      />
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-[80%] flex flex-col max-h-[100%]">
            <DialogHeader>
              <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
                {t("appointments.rescheduleDialog.title")}
              </DialogTitle>
              <DialogDescription>
                {appointment.option.name}{" "}
                {t("appointments.rescheduleDialog.by")}{" "}
                {appointment.fields.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full overflow-auto">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-2">
                  <div className="w-full space-y-8 relative px-1 content-center">
                    <FormField
                      control={form.control}
                      name="dateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("appointments.rescheduleDialog.dateTime")}
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              use12HourFormat={uses12HourFormat}
                              disabled={loading}
                              min={new Date()}
                              timeZone={timeZone}
                              {...field}
                              className="flex w-full"
                              minutesDivisibleBy={5}
                              commitOnChange
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("appointments.rescheduleDialog.duration")}
                          </FormLabel>
                          <FormControl>
                            <DurationInput disabled={loading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doNotNotifyCustomer"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-row items-center gap-2">
                            <Checkbox
                              id="do-not-notify-customer"
                              disabled={loading}
                              checked={!!field.value}
                              onCheckedChange={(e) => field.onChange(!!e)}
                            />
                            <FormLabel
                              htmlFor="do-not-notify-customer"
                              className="cursor-pointer"
                            >
                              {t(
                                "appointments.rescheduleDialog.doNotNotifyCustomer",
                              )}
                            </FormLabel>
                          </div>
                          <FormDescription>
                            {t(
                              "appointments.rescheduleDialog.doNotNotifyCustomerDescription",
                            )}
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    {isOverlaping && (
                      <FormItem>
                        <div className="flex flex-row items-center gap-2">
                          <Checkbox
                            id="confirm-overlap"
                            disabled={loading}
                            checked={confirmOverlap}
                            onCheckedChange={(e) => setConfirmOverlap(!!e)}
                          />
                          <FormLabel
                            htmlFor="confirm-overlap"
                            className="cursor-pointer"
                          >
                            {t("appointments.rescheduleDialog.confirmOverlap")}
                          </FormLabel>
                        </div>
                        <FormDescription>
                          {t(
                            "appointments.rescheduleDialog.confirmOverlapDescription",
                          )}
                        </FormDescription>
                      </FormItem>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <AppointmentCalendar
                      appointment={appointment}
                      onEventsLoad={setCalendarEvents}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="!justify-between flex-row gap-2">
              <DialogClose asChild>
                <Button variant="secondary">
                  {t("appointments.rescheduleDialog.close")}
                </Button>
              </DialogClose>
              <AlertDialog
                open={openConfirmDialog}
                onOpenChange={setOpenConfirmDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    disabled={!isValid || (isOverlaping && !confirmOverlap)}
                  >
                    {t("appointments.rescheduleDialog.reschedule")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("appointments.rescheduleDialog.confirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("appointments.rescheduleDialog.confirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("appointments.rescheduleDialog.cancel")}
                    </AlertDialogCancel>
                    <Button
                      disabled={loading}
                      onClick={reschedule}
                      className="flex flex-row gap-1 items-center"
                    >
                      {loading && <Spinner />}{" "}
                      <span>
                        {t("appointments.rescheduleDialog.reschedule")}
                      </span>
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};
