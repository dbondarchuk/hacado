"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import { AppointmentHistoryEntry } from "@hacado/types";
import { useInView } from "react-intersection-observer";

import { adminApi } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import {
  Badge,
  cn,
  Skeleton,
  toast,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useCurrencyFormat,
  useIsMobile,
  useTimeZone,
} from "@hacado/ui";
import {
  Banknote,
  BanknoteX,
  CalendarCheck,
  CalendarCog,
  CalendarPlus2,
  CalendarX,
  HistoryIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import React from "react";

const HistoryEntryTypeIcon: React.FC<{
  entry: AppointmentHistoryEntry;
  className?: string;
}> = ({ entry, className }) => {
  switch (entry.type) {
    case "rescheduled":
      return <HistoryIcon className={className} />;
    case "created":
      return <CalendarPlus2 className={className} />;
    case "paymentAdded":
      return <Banknote className={className} />;
    case "paymentRefunded":
      return <BanknoteX className={className} />;
    case "updated":
      return <CalendarCog className={className} />;
    case "statusChanged":
      switch (entry.data.newStatus) {
        case "confirmed":
          return <CalendarCheck className={className} />;
        case "declined":
          return <CalendarX className={className} />;
      }
    default:
      return <HistoryIcon className={className} />;
  }
};

const HistoryEntry: React.FC<{ entry: AppointmentHistoryEntry }> = ({
  entry,
}) => {
  const t = useI18n();
  const dateTime = DateTime.fromJSDate(entry.dateTime);
  const locale = useLocale();
  const timeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();

  const isMobile = useIsMobile();

  return (
    <div className="w-full rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3 min-w-0">
          <HistoryEntryTypeIcon
            className="size-5 text-muted-foreground flex-shrink-0"
            entry={entry}
          />
          <p className="font-medium text-base truncate">
            {t(`admin.common.labels.appointmentHistoryType.${entry.type}`)}
          </p>
        </div>
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <span className="text-sm text-muted-foreground underline decoration-dashed cursor-help">
              {dateTime.setLocale(locale).toRelative()}
            </span>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent side={isMobile ? "bottom" : "left"}>
            {dateTime.toLocaleString(DateTime.DATETIME_MED, { locale })}
          </TooltipResponsiveContent>
        </TooltipResponsive>
      </div>
      <div className="p-4 pt-3">
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {entry.type === "created" && (
            <>
              <Badge
                variant="default"
                className={cn(
                  "text-sm",
                  entry.data.confirmed && "bg-green-500",
                )}
              >
                {t(
                  `admin.appointments.status.${entry.data.confirmed ? "confirmed" : "pending"}`,
                )}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {entry.data.by === "customer"
                  ? t("admin.appointments.history.byCustomer")
                  : t("admin.appointments.history.byMember")}
              </Badge>
              {!!entry.data.payment?.appName && (
                <Badge variant="outline" className="text-sm">
                  {t("admin.appointments.history.payment", {
                    amount: currencyFormat(entry.data.payment.amount),
                    appName: t(
                      AvailableApps[entry.data.payment.appName].displayName,
                    ),
                  })}
                </Badge>
              )}
            </>
          )}
          {entry.type === "statusChanged" && (
            <>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm",
                  entry.data.oldStatus === "confirmed" && "bg-green-500",
                  entry.data.oldStatus === "declined" && "bg-destructive",
                )}
              >
                {t("admin.appointments.history.oldStatus", {
                  oldStatus: t(
                    `admin.appointments.status.${entry.data.oldStatus}`,
                  ),
                })}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm",
                  entry.data.newStatus === "confirmed" && "bg-green-500",
                  entry.data.newStatus === "declined" && "bg-destructive",
                )}
              >
                {t("admin.appointments.history.newStatus", {
                  newStatus: t(
                    `admin.appointments.status.${entry.data.newStatus}`,
                  ),
                })}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {entry.data.by === "customer"
                  ? t("admin.appointments.history.byCustomer")
                  : t("admin.appointments.history.byMember")}
              </Badge>
            </>
          )}
          {entry.type === "rescheduled" && (
            <>
              <Badge variant="outline" className="text-sm">
                {t("admin.appointments.history.oldDateTime", {
                  oldDateTime: DateTime.fromJSDate(entry.data.oldDateTime)
                    .setZone(timeZone)
                    .toLocaleString(DateTime.DATETIME_MED, { locale }),
                })}
              </Badge>
              <Badge variant="default" className="text-sm">
                {t("admin.appointments.history.newDateTime", {
                  newDateTime: DateTime.fromJSDate(entry.data.newDateTime)
                    .setZone(timeZone)
                    .toLocaleString(DateTime.DATETIME_MED, { locale }),
                })}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {entry.data.by === "customer"
                  ? t("admin.appointments.history.byCustomer")
                  : t("admin.appointments.history.byMember")}
              </Badge>
            </>
          )}
          {entry.type === "paymentAdded" && (
            <>
              <Badge variant="default" className="text-sm">
                {currencyFormat(entry.data.payment.amount)}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {t("admin.appointments.history.paymentType", {
                  type: t(`admin.payment.types.${entry.data.payment.type}`),
                  appName: entry.data.payment.appName
                    ? t(AvailableApps[entry.data.payment.appName].displayName)
                    : entry.data.payment.method === "gift-card"
                      ? t("admin.payment.methods.giftCard")
                      : entry.data.payment.method === "cash"
                        ? t("admin.payment.methods.cash")
                        : t("admin.payment.methods.card"),
                })}
              </Badge>
            </>
          )}
          {entry.type === "paymentRefunded" && (
            <>
              <Badge variant="default" className="text-sm">
                {t("admin.appointments.history.refundedAmount", {
                  amount: currencyFormat(entry.data.refundedAmount),
                })}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {t("admin.appointments.history.totalRefunded", {
                  amount: currencyFormat(entry.data.totalRefunded),
                })}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {entry.data.payment.appName
                  ? t(
                      `apps.${AvailableApps[entry.data.payment.appName].displayName}`,
                    )
                  : entry.data.payment.method === "cash"
                    ? t("admin.payment.methods.cash")
                    : t("admin.payment.methods.card")}
              </Badge>
            </>
          )}
          {entry.type === "updated" && (
            <>
              <Badge variant="outline" className="text-sm">
                {t("admin.appointments.history.oldOption", {
                  oldOption: entry.data.oldOption.name,
                })}
              </Badge>
              <Badge variant="default" className="text-sm">
                {t("admin.appointments.history.newOption", {
                  newOption: entry.data.newOption.name,
                })}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {t("admin.appointments.history.oldDateTime", {
                  oldDateTime: DateTime.fromJSDate(entry.data.oldDateTime)
                    .setZone(timeZone)
                    .toLocaleString(DateTime.DATETIME_MED, { locale }),
                })}
              </Badge>
              <Badge variant="default" className="text-sm">
                {t("admin.appointments.history.newDateTime", {
                  newDateTime: DateTime.fromJSDate(entry.data.newDateTime)
                    .setZone(timeZone)
                    .toLocaleString(DateTime.DATETIME_MED, { locale }),
                })}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryEntrySkeleton: React.FC<{ length?: number }> = ({
  length = 3,
}) => {
  return Array.from({ length }).map((_, index) => (
    <div key={index} className="w-full rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="p-4 pt-3">
        {/* <div className="flex flex-row gap-1 text-base mt-1">
          <Skeleton className="w-full h-10" />
        </div> */}
        <div className="flex items-center space-x-2 flex-wrap">
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
        </div>
      </div>
    </div>
  ));
};

const toLoad = 10;

export type AppointmentHistoryProps = {
  appointmentId: string;
};

export const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({
  appointmentId,
}) => {
  const t = useI18n("admin");
  const [entries, setEntries] = React.useState<AppointmentHistoryEntry[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const loadEntries = React.useCallback(
    async (page: number) => {
      const result = await adminApi.appointments.getAppointmentHistory(
        appointmentId,
        {
          page,
          limit: toLoad,
        },
      );

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [appointmentId],
  );

  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    setInitialLoad(false);
    setEntries([]);
  }, [appointmentId]);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await loadEntries(page);

        if (page === 1) {
          setEntries(result.items);
        } else {
          setEntries((prev) => [...prev, ...result.items]);
        }

        setHasMore(result.hasMore);
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error(t("communications.requestError"));
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [page, loadEntries, initialLoad, hasMore]);

  React.useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore]);

  return (
    <div className="grid grid-cols-1 gap-2 py-2">
      {loading && page === 1 && <HistoryEntrySkeleton />}
      {entries?.map((entry) => <HistoryEntry entry={entry} key={entry._id} />)}
      {hasMore && !loading && <div ref={ref} className="h-1" />}
      {loading && page > 1 && <HistoryEntrySkeleton />}
    </div>
  );
};
