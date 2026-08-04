"use client";

import { useI18n, useLocale } from "@timelish/i18n/client";
import type { Appointment, AppointmentStatus } from "@timelish/types";
import {
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  IComboboxItem,
  Skeleton,
  toast,
  useCurrencyFormat,
} from "@timelish/ui";
import { durationToTime } from "@timelish/utils";
import { getTimeZones } from "@vvo/tzdb";
import {
  Check,
  ChevronDown,
  Copy,
  Globe2,
  Sparkles,
  Video,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import {
  MyCabinetPublicKeys,
  MyCabinetPublicNamespace,
  myCabinetPublicNamespace,
} from "../../../translations/types";
import {
  getAppointmentsSummaryAction,
  getPastAppointmentsAction,
  getUpcomingAppointmentsAction,
  SessionExpiredError,
} from "../actions";
import { useCustomerProfile } from "../customer-profile-context";
import { useOnSessionExpired } from "../session-expired-context";

const tzOptions: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  shortLabel: zone.alternativeName,
  value: zone.name,
}));

type AppointmentsScreenProps = {
  appId: string;
};

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success(t("block.appointments.copied", { label }));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const title = copied
    ? t("block.appointments.copied", { label })
    : t("block.appointments.copy", { label });

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={title}
      className="ml-1.5 inline-flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="size-3 text-green-500" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-500/15 text-green-600 dark:text-green-400",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  declined: "bg-destructive/15 text-destructive",
};

const StatusBadge = ({ status }: { status?: AppointmentStatus }) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );

  if (!status) return null;
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls} appointment-item-status`}
    >
      {t(`block.appointments.status.${status}`)}
    </span>
  );
};

const AppointmentItem = ({
  item,
  isUpcoming,
  timeZone,
}: {
  item: Appointment;
  isUpcoming: boolean;
  timeZone: string;
}) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );
  const i18n = useI18n("translation");
  const locale = useLocale();
  const formatCurrency = useCurrencyFormat();
  const [open, setOpen] = useState(false);

  const serviceName =
    item.option?.name ?? t("block.appointments.appointmentFallback");
  const dt = DateTime.fromJSDate(item.dateTime).setZone(timeZone);
  const dateLabel = dt.setLocale(locale).toFormat("EEE, MMM d, yyyy");
  const timeLabel = dt.toLocaleString(DateTime.TIME_SIMPLE, { locale });
  const endTimeLabel = DateTime.fromJSDate(item.endAt)
    .setZone(timeZone)
    .toLocaleString(DateTime.TIME_SIMPLE, { locale });
  const durationLabel = i18n(
    "common.formats.durationHourMin",
    durationToTime(item.totalDuration),
  );
  const priceLabel =
    item.totalPrice != null ? formatCurrency(item.totalPrice) : null;

  const amountLeftToPay = useMemo(() => {
    if (item.totalPrice == null) return null;
    const paid = (item.payments ?? [])
      .filter((p) => p.type === "deposit" || p.type === "payment")
      .reduce((sum, p) => {
        const refunded = p.refunds?.reduce((r, ref) => r + ref.amount, 0) ?? 0;
        return sum + p.amount - refunded;
      }, 0);
    const left = item.totalPrice - paid;
    return left > 0 ? left : null;
  }, [item.totalPrice, item.payments]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-border bg-card transition-colors hover:bg-accent/30 appointment-item"
    >
      <CollapsibleTrigger className="w-full text-left px-4 py-3 appointment-item-trigger">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 appointment-item-icon">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col md:flex-row gap-2 flex-1 min-w-0">
            <div className="flex-1 flex flex-row gap-2 min-w-0 appointment-item-info">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground leading-tight appointment-item-service">
                  {serviceName}
                </p>
                <StatusBadge status={item.status} />
              </div>
            </div>

            <div className="text-left md:text-right flex flex-row md:flex-col gap-2 shrink-0 appointment-item-datetime">
              <p className="text-sm font-medium text-foreground appointment-item-date">
                {dateLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 appointment-item-time">
                {timeLabel}
              </p>
            </div>
          </div>

          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground shrink-0 transition-transform duration-200 appointment-item-chevron",
              open && "rotate-180",
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-3 border-t border-border/50 flex flex-col gap-4 w-full appointment-item-details">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 flex-1">
            <div className="flex gap-6 appointment-item-meta">
              <div className="appointment-item-duration">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground appointment-item-duration-label">
                  {t("block.appointments.duration")}
                </p>
                <p className="text-sm text-foreground mt-1 appointment-item-duration-text">
                  {durationLabel}
                </p>
              </div>
              <div className="appointment-item-time-range">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground appointment-item-time-range-label">
                  {t("block.appointments.time")}
                </p>
                <p className="text-sm text-foreground mt-1 appointment-item-time-range-text">
                  {timeLabel} – {endTimeLabel}
                </p>
              </div>
              {priceLabel && (
                <div className="appointment-item-price">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground appointment-item-price-label">
                    {t("block.appointments.price")}
                  </p>
                  <p className="text-sm text-foreground mt-1 appointment-item-price-text">
                    {priceLabel}
                  </p>
                </div>
              )}
              {amountLeftToPay != null && (
                <div className="appointment-item-amount-due">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground appointment-item-amount-due-label">
                    {t("block.appointments.amountDue")}
                  </p>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1 appointment-item-amount-due-text">
                    {formatCurrency(amountLeftToPay)}
                  </p>
                </div>
              )}
            </div>

            {isUpcoming && item.status !== "declined" && (
              <div className="flex gap-2 shrink-0 flex-wrap w-full md:w-auto justify-end appointment-item-actions">
                <Button
                  variant="outline"
                  size="sm"
                  className="appointment-item-reschedule"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = `reschedule:${item._id}`;
                  }}
                >
                  {t("block.appointments.reschedule")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="appointment-item-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = `cancel:${item._id}`;
                  }}
                >
                  {t("block.appointments.cancel")}
                </Button>
              </div>
            )}
          </div>
          {item.meetingInformation && item.status !== "declined" && (
            <div className="w-full rounded-lg bg-muted/50 border border-border/50 px-4 py-3 space-y-2 appointment-item-meeting">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground appointment-item-meeting-label">
                {t("block.appointments.meetingDetails")}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 flex-1">
                <div className="appointment-item-meeting-id">
                  <p className="text-[10px] text-muted-foreground">
                    {t("block.appointments.meetingId")}
                  </p>
                  <p className="text-sm font-mono text-foreground flex items-center">
                    {item.meetingInformation.meetingId}
                    <CopyButton
                      value={item.meetingInformation.meetingId}
                      label={t("block.appointments.meetingId")}
                    />
                  </p>
                </div>
                {item.meetingInformation.meetingPassword && (
                  <div className="appointment-item-meeting-password">
                    <p className="text-[10px] text-muted-foreground">
                      {t("block.appointments.meetingPassword")}
                    </p>
                    <p className="text-sm font-mono text-foreground flex items-center">
                      {item.meetingInformation.meetingPassword}
                      <CopyButton
                        value={item.meetingInformation.meetingPassword}
                        label={t("block.appointments.meetingPassword")}
                      />
                    </p>
                  </div>
                )}
                <div className="appointment-item-meeting-url min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    {t("block.appointments.meetingUrl")}
                  </p>
                  <a
                    href={item.meetingInformation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-primary underline underline-offset-2 truncate block max-w-xs"
                  >
                    {item.meetingInformation.url}
                  </a>
                </div>
                {item.meetingInformation?.url && (
                  <Button
                    size="sm"
                    className="appointment-item-join-meeting gap-1.5 w-full"
                    asChild
                  >
                    <a
                      href={item.meetingInformation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Video className="size-3.5" />
                      {t("block.appointments.joinMeeting")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const AppointmentItemSkeletons = ({ length }: { length: number }) => {
  const skeletons = Array.from({ length }).map((_, index) => (
    <div
      key={index}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <Skeleton className="w-full h-[68px]" />
    </div>
  ));
  return <>{skeletons}</>;
};

export const AppointmentsScreen = ({ appId }: AppointmentsScreenProps) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );
  const i18n = useI18n("translation");
  const {
    customer: customerProfile,
    timezone,
    setTimeZone,
  } = useCustomerProfile();
  const onSessionExpired = useOnSessionExpired();

  const [isLoading, setIsLoading] = useState(true);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [pastPage, setPastPage] = useState(1);
  const [hasPastNextPage, setHasPastNextPage] = useState(false);
  const [isPastPageLoading, setIsPastPageLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [summaryRes, upcomingRes, pastRes] = await Promise.all([
          getAppointmentsSummaryAction(appId),
          getUpcomingAppointmentsAction(appId),
          getPastAppointmentsAction(appId, 1, 10),
        ]);
        if (!mounted) return;
        setUpcomingCount(summaryRes.upcomingCount ?? 0);
        setPastCount(summaryRes.pastCount ?? 0);
        setUpcoming(upcomingRes.items ?? []);
        setPast(pastRes.items ?? []);
        setPastPage(1);
        setHasPastNextPage(!!pastRes.hasNextPage);
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          onSessionExpired();
          return;
        }
        if (mounted) toast.error(t("block.appointments.loadError"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appId]);

  const loadPastPage = async (page: number) => {
    setIsPastPageLoading(true);
    try {
      const response = await getPastAppointmentsAction(appId, page, 10);
      setPast(response.items ?? []);
      setPastPage(page);
      setHasPastNextPage(!!response.hasNextPage);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      toast.error(t("block.appointments.loadError"));
    } finally {
      setIsPastPageLoading(false);
    }
  };

  const canGoPrev = useMemo(() => pastPage > 1, [pastPage]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 appointments-container">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 appointments-header">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="text-2xl font-semibold text-foreground appointments-welcome-text">
            {t("block.appointments.welcome")}
          </h3>
          <h3 className="text-3xl font-bold text-foreground appointments-customer-name">
            {customerProfile?.name ?? t("block.appointments.customerFallback")}
          </h3>
          <div className="text-sm text-muted-foreground appointments-counts">
            {isLoading ? (
              <Skeleton className="w-32 h-4" />
            ) : (
              t("block.appointments.counts", {
                upcoming: upcomingCount,
                completed: pastCount,
              })
            )}
          </div>
        </div>
        <div className="shrink-0 pt-1 appointments-timezone-selector">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe2 className="size-3.5 shrink-0" />
            <Combobox
              values={tzOptions}
              searchLabel={i18n("common.labels.searchTimezone")}
              customSearch={(search) =>
                tzOptions.filter((z) =>
                  (z.label as string)
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
                )
              }
              value={timezone}
              onItemSelect={(value) => setTimeZone(value)}
              className="text-xs"
              size="xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 appointments-upcoming-section">
        <div className="text-xs uppercase tracking-wider text-muted-foreground appointments-upcoming-label">
          {t("block.appointments.upcoming")}
        </div>
        {isLoading ? (
          <AppointmentItemSkeletons length={3} />
        ) : upcoming.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("block.appointments.emptyUpcoming")}
          </div>
        ) : (
          upcoming.map((item) => (
            <AppointmentItem
              key={item._id}
              item={item}
              isUpcoming
              timeZone={timezone}
            />
          ))
        )}
      </div>

      <div className="space-y-3 appointments-past-section">
        <div className="text-xs uppercase tracking-wider text-muted-foreground appointments-past-label">
          {t("block.appointments.past")}
        </div>
        {isLoading || isPastPageLoading ? (
          <AppointmentItemSkeletons length={5} />
        ) : past.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("block.appointments.emptyPast")}
          </div>
        ) : (
          <>
            {past.map((item) => (
              <AppointmentItem
                key={item._id}
                item={item}
                isUpcoming={false}
                timeZone={timezone}
              />
            ))}
            <div className="flex items-center justify-center gap-2 pt-2 appointments-pagination">
              <Button
                variant="link-underline"
                size="md"
                className="appointments-prev-button"
                disabled={!canGoPrev || isPastPageLoading}
                onClick={() => loadPastPage(pastPage - 1)}
              >
                {t("block.appointments.prev")}
              </Button>
              <div className="text-sm text-muted-foreground appointments-page-indicator">
                {t("block.appointments.page", { page: pastPage })}
              </div>
              <Button
                variant="link-underline"
                size="md"
                className="appointments-next-button"
                disabled={!hasPastNextPage || isPastPageLoading}
                onClick={() => loadPastPage(pastPage + 1)}
              >
                {t("block.appointments.next")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
