"use client";

import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Link,
  ScrollArea,
  Spinner,
  toastPromise,
  useTimeZone,
} from "@timelish/ui";
import { SendCommunicationDialog } from "@timelish/ui-admin-kit";
import { durationToTime } from "@timelish/utils";
import { CalendarPlus, Send, X } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { WaitlistEntry } from "../../models";
import {
  WaitlistAdminKeys,
  waitlistAdminNamespace,
  WaitlistAdminNamespace,
} from "../../translations/types";
import { dismissWaitlistEntry } from "./actions";

export type WaitlistCardProps = {
  entry: WaitlistEntry;
  appId: string;
};

export const WaitlistCard: React.FC<WaitlistCardProps> = ({ entry, appId }) => {
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const tAdmin = useI18n("admin");

  const router = useRouter();
  const locale = useLocale();
  const timeZone = useTimeZone();

  const [loading, setLoading] = useState(false);
  const onDismiss = async () => {
    setLoading(true);
    try {
      await toastPromise(dismissWaitlistEntry(appId, entry._id), {
        success: t("view.toast.dismissed"),
        error: tAdmin("common.toasts.error"),
      });

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:max-w-sm rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar>
            <AvatarImage
              src={entry.customer?.avatar ?? undefined}
              alt={entry.customer?.name ?? entry.name}
            />
            <AvatarFallback>
              {(entry.customer?.name ?? entry.name)
                .split(" ")
                .map((name) => name[0]?.toUpperCase())
                .filter((name) => name)
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {t.rich("view.byFormat", {
                name: entry.customer?.name ?? entry.name,
                link: (chunks: any) => (
                  <Link
                    href={`/dashboard/customers/${entry.customerId}`}
                    variant="underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {entry.option?.name ?? t("view.unknown")}
            </p>
          </div>
        </div>
        <span className="ml-3 shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
          {t("view.badge")}
        </span>
      </div>

      {/* Availability */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          {t("view.preferredAvailability")}
          {entry.duration
            ? ` · ${tAdmin("common.timeDuration", durationToTime(entry.duration))}`
            : ""}
        </p>

        {entry.asSoonAsPossible ? (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100">
              {t("view.asSoonAsPossible")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("view.noSpecificDates")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {entry.dates
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 3)
              .map(({ date, time }) => (
                <div key={date} className="flex items-start gap-3">
                  <div className="text-xs font-medium text-muted-foreground w-20  pt-1">
                    {DateTime.fromISO(date, {
                      zone: timeZone,
                    })
                      .setLocale(locale)
                      .toFormat("EEE, MMM d")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {time.map((timeSlot) => (
                      <span
                        key={timeSlot}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                      >
                        {t(`view.times.short.${timeSlot}`)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {entry.dates.length > 3 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link-dashed">{t("view.viewAll")}</Button>
                </DialogTrigger>
                <DialogContent
                  className="flex flex-col max-h-full"
                  overlayVariant="blur"
                >
                  <DialogHeader>
                    <DialogTitle>{t("view.dates")}</DialogTitle>
                  </DialogHeader>
                  <div className="grid">
                    <ScrollArea className="max-h-[60vh]">
                      <div className="flex flex-col gap-2">
                        {entry.dates
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((dateEntry, index) => (
                            <div
                              key={dateEntry.date}
                              className="flex items-start gap-3"
                            >
                              <div className="text-xs font-medium text-muted-foreground w-20  pt-1">
                                {DateTime.fromISO(dateEntry.date, {
                                  zone: timeZone,
                                })
                                  .setLocale(locale)
                                  .toFormat("EEE, MMM d")}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {dateEntry.time.map((timeSlot) => (
                                  <span
                                    key={timeSlot}
                                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                                  >
                                    {t(`view.times.descriptions.${timeSlot}`)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">
                        {tAdmin("common.buttons.close")}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Team member */}
      {entry.member && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">
            {t("view.member")}
          </p>
          <div className="flex items-center gap-3 min-w-0">
            <Avatar>
              <AvatarImage
                src={entry.member.image ?? undefined}
                alt={
                  entry.member.name || entry.member.email || t("view.member")
                }
              />
              <AvatarFallback>
                {(entry.member.name || entry.member.email || "?")
                  .split(" ")
                  .map((part) => part[0]?.toUpperCase())
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-col">
              <span className="text-sm font-medium text-foreground truncate">
                {entry.member.name || entry.member.email || "—"}
              </span>
              {entry.member.name && entry.member.email ? (
                <span className="text-xs text-muted-foreground truncate">
                  {entry.member.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Add-ons */}
      {entry.addons && entry.addons.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">
            {t("view.addons")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entry.addons.map((addon) => (
              <span
                key={addon._id}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
              >
                {addon.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      {!!entry.note && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
            {t("view.note")}
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            <Dialog>
              <DialogTrigger asChild>
                <div className="whitespace-pre-wrap cursor-pointer">
                  {entry.note.substring(0, 50) +
                    (entry.note.length > 50 ? "..." : "")}
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[80%] flex flex-col max-h-[80svh]">
                <DialogHeader>
                  <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
                    {t("view.note")}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 w-full overflow-auto whitespace-pre-wrap">
                  {entry.note}
                </div>
                <DialogFooter className="flex-row !justify-between gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">
                      {t("table.actions.close")}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </p>
        </div>
      )}

      <div className="flex-1" />

      {/* Timestamp */}
      <div className="px-5 py-2.5 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {t("view.submitted", {
            date: DateTime.fromJSDate(entry.createdAt, {
              zone: timeZone,
            })
              .setLocale(locale)
              .toLocaleString(DateTime.DATETIME_FULL),
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <Link
          href={`/dashboard/waitlist/appointment/new?id=${entry._id}`}
          button
          className="w-full"
          variant="primary"
        >
          <CalendarPlus />
          {t("view.createAppointment")}
        </Link>
        <div className="flex gap-2">
          <SendCommunicationDialog customerId={entry.customerId}>
            <Button className="flex-1" variant="secondary">
              <Send />
              {t("view.sendMessage")}
            </Button>
          </SendCommunicationDialog>
          <Button
            onClick={onDismiss}
            className="flex-1"
            variant="destructive"
            disabled={loading}
          >
            {loading ? <Spinner /> : <X />}
            {t("view.dismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
};
