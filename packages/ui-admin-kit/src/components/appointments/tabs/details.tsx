"use client";

import { adminApi } from "@hacado/api-sdk";
import { AdminKeys, useI18n, useLocale } from "@hacado/i18n/client";
import { Appointment, AppointmentStatus, timeZones } from "@hacado/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Link,
  Textarea,
  toastPromise,
  use12HourFormat,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import { CustomerName, useAuth } from "@hacado/ui-admin";
import { canUpdateAppointment, durationToTime } from "@hacado/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarX2, Wallet } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AddUpdatePaymentDialog } from "../..";
import { AppointmentActionButton } from "../action-button";
import { AppointmentCalendar } from "../appointment-calendar";
import { AppointmentDeclineDialog } from "../appointment-decline-dialog";
import { APPOINTMENT_STATUS_STYLES } from "../const";
import { AppointmentViewContext } from "../context";

const noteFormSchema = z.object({
  note: z.string().optional(),
});

type NoteFormSchema = z.infer<typeof noteFormSchema>;

type AppointmentDetailsProps = {
  appointment: Appointment;
};

export const AppointmentDetails = ({
  appointment,
}: AppointmentDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();
  const uses12HourFormat = use12HourFormat();
  const router = useRouter();
  const { user } = useAuth();
  const canUpdate = canUpdateAppointment(user, appointment.memberId);

  const { setAppointment, setKey } = useContext(AppointmentViewContext);
  const updateStatus = (newStatus: AppointmentStatus) => {
    setAppointment((prev) => ({
      ...prev,
      status: newStatus,
    }));

    setKey(new Date().getTime().toString());
  };

  const duration = durationToTime(appointment.totalDuration);
  const paidPayments = appointment.payments?.filter(
    (payment) => payment.status === "paid",
  );

  const syncedPayment = appointment.payments?.find(
    (payment) =>
      payment.method === "in-person-card" && payment.source === "synced",
  );
  const syncedProvider =
    syncedPayment?.method === "in-person-card" && syncedPayment.appName
      ? syncedPayment.appName.charAt(0).toUpperCase() +
        syncedPayment.appName.slice(1)
      : undefined;

  const totalPaid =
    appointment.payments?.reduce(
      (sum, payment) =>
        sum +
        payment.amount -
        (payment.refunds?.reduce((sum, refund) => sum + refund.amount, 0) || 0),
      0,
    ) || 0;

  const totalAmountLeft = appointment.totalPrice
    ? Math.max(
        0,
        appointment.totalPrice -
          (paidPayments
            ?.filter(
              (payment) =>
                payment.type === "payment" || payment.type === "deposit",
            )
            .reduce((sum, payment) => sum + payment.amount, 0) || 0),
      )
    : 0;

  const { name, email, phone, ...restFields } = appointment.fields;

  const noteForm = useForm<NoteFormSchema>({
    resolver: zodResolver(noteFormSchema),
    mode: "all",
    values: {
      note: appointment.note,
    },
  });

  const onNoteSubmit = async (data: NoteFormSchema) => {
    if (!canUpdate) return;
    try {
      setLoading(true);
      await toastPromise(
        adminApi.appointments.updateNote(appointment._id, data.note),
        {
          success: t("appointments.view.noteUpdated"),
          error: t("appointments.view.requestError"),
        },
      );

      router.refresh();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col @4xl:grid grid-cols-2 gap-4">
      <div className="w-full border border-border rounded-lg bg-background overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar>
              <AvatarImage
                src={appointment.customer?.avatar ?? undefined}
                alt={appointment.customer?.name ?? appointment.fields.name}
              />
              <AvatarFallback>
                {(appointment.customer?.name ?? appointment.fields.name)
                  .split(" ")
                  .map((name) => name[0]?.toUpperCase())
                  .filter((name) => name)
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                <Link
                  href={`/dashboard/customers/${appointment.customerId}`}
                  variant="underline"
                >
                  <CustomerName customer={appointment.customer} />
                </Link>
              </p>
              <p className="text-base font-medium text-foreground truncate">
                <Link
                  href={`/dashboard/appointments/${appointment._id}`}
                  variant="underline"
                >
                  {appointment.option.name}
                </Link>
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 text-sm font-medium px-2.5 py-1 rounded-full capitalize ${APPOINTMENT_STATUS_STYLES[appointment.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {t(`appointments.status.${appointment.status}`)}
          </span>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">
              {t("appointments.view.date")}
            </p>
            <p className="text-base font-medium text-foreground">
              {DateTime.fromJSDate(appointment.dateTime, {
                zone: timeZone,
              }).toLocaleString(DateTime.DATE_HUGE, { locale })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-0.5">
              {t("appointments.view.time")}
            </p>
            <p className="text-base font-medium text-foreground">
              {DateTime.fromJSDate(appointment.dateTime, {
                zone: timeZone,
              }).toFormat(uses12HourFormat ? "h:mm" : "HH:mm", { locale })}
              –
              {DateTime.fromJSDate(appointment.dateTime, {
                zone: timeZone,
              })
                .plus({ minutes: appointment.totalDuration })
                .toLocaleString(DateTime.TIME_SIMPLE, { locale })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                "common.timeDuration",
                durationToTime(appointment.totalDuration),
              )}
            </p>
          </div>
        </div>

        {/* Payment */}
        {!!appointment.totalPrice && (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                {t("appointments.view.payment.label")}
              </p>
              {syncedProvider && (
                <Badge variant="secondary" className="shrink-0">
                  {t("syncedPayments.badge.synced", {
                    provider: syncedProvider,
                  })}
                </Badge>
              )}
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              <div className="bg-background rounded-lg flex-1 p-3 border border-border">
                <p className="text-sm text-muted-foreground mb-0.5">
                  {t("appointments.view.payment.total")}
                </p>
                <p className="text-lg font-medium text-foreground">
                  {currencyFormat(
                    appointment.totalPrice +
                      (appointment.discount?.discountAmount || 0),
                  )}
                </p>
              </div>
              {appointment.discount && (
                <div className="bg-background rounded-lg flex-1 p-3 border border-border">
                  <p className="text-sm text-muted-foreground mb-0.5">
                    {t("appointments.view.payment.discount")}
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    {currencyFormat(-1 * appointment.discount.discountAmount)}
                  </p>
                </div>
              )}
              <div className="bg-background rounded-lg flex-1 p-3 border border-border">
                <p className="text-sm text-muted-foreground mb-0.5">
                  {t("appointments.view.payment.paid")}
                </p>
                <p className="text-lg font-medium text-green-600">
                  {currencyFormat(totalPaid)}
                </p>
              </div>
              {appointment.status !== "declined" && (
                <div className="bg-background rounded-lg flex-1 p-3 border border-border">
                  <p className="text-sm text-muted-foreground mb-0.5">
                    {t("appointments.view.payment.due")}
                  </p>
                  <p
                    className={`text-lg font-medium ${totalAmountLeft > 0 ? "text-destructive" : "text-foreground"}`}
                  >
                    {currencyFormat(totalAmountLeft)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
            {t("appointments.view.customer")}
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("appointments.view.name")}
              </span>
              <Link
                href={`/dashboard/customers/${appointment.customerId}`}
                variant="underline"
                className="truncate text-ellipsis text-sm"
              >
                <CustomerName customer={appointment.customer} />
              </Link>
            </div>
            {!appointment.customer.isDeleted && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("appointments.view.email")}
                  </span>
                  <Link
                    href={`mailto:${appointment.customer?.email}`}
                    variant="underline"
                    className="truncate text-ellipsis text-sm"
                  >
                    {appointment.customer.email}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t("appointments.view.phone")}
                  </span>
                  <Link
                    href={`tel:${appointment.customer?.phone}`}
                    variant="underline"
                    className="truncate text-ellipsis text-sm"
                  >
                    {appointment.customer.phone}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team member */}
        {appointment.member && (
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
              {t("appointments.view.member")}
            </p>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar>
                <AvatarImage
                  src={appointment.member.image ?? undefined}
                  alt={
                    appointment.member.name ||
                    appointment.member.email ||
                    t("appointments.view.member")
                  }
                />
                <AvatarFallback>
                  {(appointment.member.name || appointment.member.email || "?")
                    .split(" ")
                    .map((part) => part[0]?.toUpperCase())
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <span className="text-sm font-medium text-foreground truncate">
                  {appointment.member.name || appointment.member.email || "—"}
                </span>
                {appointment.member.name && appointment.member.email ? (
                  <span className="text-xs text-muted-foreground truncate">
                    {appointment.member.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Service */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
            {t("appointments.view.service")}
          </p>
          <div className="flex justify-between items-start">
            <div>
              <Link
                href={`/dashboard/options/${appointment.option._id}`}
                variant="underline"
                className="truncate text-ellipsis text-sm"
              >
                {appointment.option.name}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t(
                  "common.timeDuration",
                  durationToTime(appointment.option.duration),
                )}
              </p>
            </div>
            {!!appointment.option.price && (
              <span className="text-base font-medium text-foreground shrink-0 ml-3">
                {currencyFormat(appointment.option.price)}
              </span>
            )}
          </div>
        </div>

        {/* Add-ons */}
        {appointment.addons && appointment.addons.length > 0 && (
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
              {t("appointments.view.addons")}
            </p>
            <div className="flex flex-col gap-2">
              {appointment.addons.map((addon) => (
                <div
                  key={addon._id}
                  className="flex justify-between items-start"
                >
                  <div>
                    <Link
                      href={`/dashboard/addons/${addon._id}`}
                      variant="underline"
                      className="truncate text-ellipsis text-sm"
                    >
                      {addon.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(
                        "common.timeDuration",
                        durationToTime(addon.duration || 0),
                      )}
                    </p>
                  </div>
                  {!!addon.price && (
                    <span className="text-base font-medium text-foreground shrink-0 ml-3">
                      {currencyFormat(addon.price)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/** Discount */}
        {appointment.discount && (
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
              {t("appointments.view.discount.label")}
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.discount.name")}</span>
                <Link
                  href={`/dashboard/services/discounts/${appointment.discount.id}`}
                  variant="underline"
                  className="truncate text-ellipsis text-sm text-right"
                >
                  {appointment.discount.name}
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.discount.code")}</span>
                <span className="text-sm font-medium text-foreground shrink-0 ml-3">
                  {appointment.discount.code}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.discount.amount")}</span>
                <span className="text-base font-medium text-foreground shrink-0 ml-3">
                  {currencyFormat(-1 * appointment.discount.discountAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/** Fields */}
        {appointment.fields && Object.keys(appointment.fields).length > 0 && (
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
              {t("appointments.view.fields")}
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.name")}</span>
                <span className="text-foreground">
                  {appointment.fields.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.email")}</span>
                <span className="text-foreground">
                  {appointment.fields.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.phone")}</span>
                <span className="text-foreground">
                  {appointment.fields.phone}
                </span>
              </div>
              {Object.entries(restFields).map(([key, value]) => (
                <div className="flex justify-between items-center" key={key}>
                  <span>
                    {appointment.fieldsLabels?.[key] ? (
                      <>
                        <span>{appointment.fieldsLabels?.[key]}</span>{" "}
                        <span className="text-sm text-muted-foreground">
                          ({key})
                        </span>
                      </>
                    ) : (
                      key
                    )}
                    :
                  </span>
                  <span className="text-foreground">
                    {typeof value === "boolean"
                      ? value
                        ? t("appointments.view.yes")
                        : t("appointments.view.no")
                      : value.toString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/** Meeting info */}
        {appointment.meetingInformation && (
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
              {t("appointments.view.meetingInformation.label")}
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>{t("appointments.view.meetingInformation.url")}</span>
                <Link
                  href={appointment.meetingInformation.url}
                  variant="underline"
                  className="truncate text-ellipsis text-sm text-right"
                  target="_blank"
                >
                  {appointment.meetingInformation.url}
                </Link>
              </div>

              <div className="flex justify-between items-center">
                <span>{t("appointments.view.meetingInformation.type")}</span>
                <span>
                  {t.has(
                    `onlineMeeting.types.${appointment.meetingInformation.type}` as AdminKeys,
                  )
                    ? t(
                        `onlineMeeting.types.${appointment.meetingInformation.type}` as AdminKeys,
                      )
                    : appointment.meetingInformation.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  {t("appointments.view.meetingInformation.meetingId")}
                </span>
                <span>{appointment.meetingInformation.meetingId}</span>
              </div>
              {appointment.meetingInformation.meetingPassword && (
                <div className="flex justify-between items-center">
                  <span>
                    {t("appointments.view.meetingInformation.meetingPassword")}
                  </span>
                  <span>{appointment.meetingInformation.meetingPassword}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Note */}
        <Form {...noteForm}>
          <form
            onSubmit={noteForm.handleSubmit(onNoteSubmit)}
            onBlur={noteForm.handleSubmit(onNoteSubmit)}
            className="px-5 py-4 border-b border-border flex flex-col gap-2 flex-1"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1.5">
              {t("appointments.view.note")}
            </p>
            <FormField
              control={noteForm.control}
              name="note"
              render={({ field }) => (
                <FormItem className="flex flex-col flex-1">
                  <FormControl>
                    <Textarea
                      disabled={loading || !canUpdate}
                      placeholder={t("appointments.view.note")}
                      className="flex-1 min-h-20"
                      autoResize
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Timestamp */}
        <div className="px-5 py-2.5 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {t("appointments.view.requestedAtFormat", {
              requestedAt: DateTime.fromJSDate(
                appointment.createdAt,
              ).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY, { locale }),
              timezone:
                timeZones.find((tz) => tz.name === appointment.timeZone)
                  ?.name || appointment.timeZone,
            })}
          </p>
        </div>

        {/* Actions */}
        {appointment.status !== "declined" && (
          <div className="px-5 py-4 flex flex-col gap-2">
            {canUpdate && totalAmountLeft > 0 && (
              <AddUpdatePaymentDialog
                amount={totalAmountLeft}
                appointmentId={appointment._id}
                customerId={appointment.customerId}
              >
                <Button variant="brand-dark" size="md" className="w-full">
                  <Wallet size={20} />
                  {t("appointments.view.collectPayment", {
                    amount: currencyFormat(totalAmountLeft),
                  })}
                </Button>
              </AddUpdatePaymentDialog>
            )}
            {canUpdate ? (
              <div className="flex flex-row gap-2 justify-between w-full">
                <AppointmentDeclineDialog
                  appointment={appointment}
                  onSuccess={updateStatus}
                  trigger={
                    <Button variant="destructive" className="w-full">
                      <CalendarX2 size={20} /> {t("appointments.view.decline")}
                    </Button>
                  }
                />
                {appointment.status === "pending" && (
                  <AppointmentActionButton
                    onSuccess={updateStatus}
                    variant="default"
                    _id={appointment._id}
                    status="confirmed"
                    icon={CalendarCheck2}
                    className="w-full"
                  >
                    {t("appointments.view.confirm")}
                  </AppointmentActionButton>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="w-full overflow-hidden p-1 flex flex-col gap-2">
        <AppointmentCalendar appointment={appointment} />
      </div>
    </div>
  );
};
