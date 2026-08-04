"use client";

import { useI18n } from "@timelish/i18n/client";
import { cn, useCurrencyFormat } from "@timelish/ui";
import {
  CalendarDays,
  Clock3,
  DollarSign,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardStats } from "./dashboard-stats";

type KpiTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  detailTone?: "muted" | "positive" | "negative" | "primary";
};

function KpiTile({
  icon: Icon,
  label,
  value,
  detail,
  detailTone = "muted",
}: KpiTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p
          className={cn(
            "text-sm",
            detailTone === "positive" &&
              "text-emerald-600 dark:text-emerald-400",
            detailTone === "negative" && "text-destructive",
            detailTone === "primary" && "text-primary",
            detailTone === "muted" && "text-muted-foreground",
          )}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}

function changeDetail(
  pct: number | null,
  vsLabel: string,
  formatPct: (n: number) => string,
): { text: string; tone: KpiTileProps["detailTone"] } {
  if (pct === null) {
    return { text: "—", tone: "muted" };
  }
  const sign = pct > 0 ? "+" : "";
  return {
    text: `${sign}${formatPct(pct)} ${vsLabel}`,
    tone: pct > 0 ? "positive" : pct < 0 ? "negative" : "muted",
  };
}

export function DashboardKpiStrip({
  stats,
  showFinancials = true,
}: {
  stats: DashboardStats;
  showFinancials?: boolean;
}) {
  const t = useI18n("admin");
  const currencyFormat = useCurrencyFormat();
  const vsLastWeek = t("dashboard.kpi.vsLastWeek");

  const weekChange = changeDetail(
    stats.thisWeekCountChangePct,
    vsLastWeek,
    (n) => `${n}%`,
  );
  const revenueChange = changeDetail(
    stats.thisWeekRevenueChangePct,
    vsLastWeek,
    (n) => `${n}%`,
  );
  const avgChange = changeDetail(
    stats.avgBookingValueChangePct,
    vsLastWeek,
    (n) => `${n}%`,
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        showFinancials && "xl:grid-cols-4",
      )}
    >
      <KpiTile
        icon={CalendarDays}
        label={t("dashboard.kpi.todayAppointments")}
        value={String(stats.todayCount)}
        detail={t("dashboard.kpi.upcomingToday", {
          count: stats.todayUpcoming,
        })}
        detailTone="primary"
      />
      <KpiTile
        icon={Users}
        label={t("dashboard.kpi.thisWeek")}
        value={String(stats.thisWeekCount)}
        detail={weekChange.text}
        detailTone={weekChange.tone}
      />
      {showFinancials ? (
        <>
          <KpiTile
            icon={DollarSign}
            label={t("dashboard.kpi.thisWeekRevenue")}
            value={currencyFormat(stats.thisWeekRevenue)}
            detail={revenueChange.text}
            detailTone={revenueChange.tone}
          />
          <KpiTile
            icon={Clock3}
            label={t("dashboard.kpi.avgBookingValue")}
            value={currencyFormat(stats.avgBookingValue)}
            detail={avgChange.text}
            detailTone={avgChange.tone}
          />
        </>
      ) : null}
    </div>
  );
}
