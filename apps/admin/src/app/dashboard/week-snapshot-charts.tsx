"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import { Link, cn } from "@hacado/ui";
import { DateTime } from "luxon";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardCustomerDayPoint,
  DashboardWeekDayCount,
} from "./dashboard-stats";

const tooltipContentStyle = {
  backgroundColor: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
};

function calendarHref(date: string, member?: string) {
  const params = new URLSearchParams({
    activeTab: "calendar",
    date,
  });
  if (member) {
    params.set("member", member);
  }
  return `/dashboard?${params.toString()}`;
}

export function WeekSnapshotCharts({
  weekDayCounts,
  customerData,
  member,
  showCustomerChart,
}: {
  weekDayCounts: DashboardWeekDayCount[];
  customerData?: DashboardCustomerDayPoint[];
  member?: string;
  showCustomerChart: boolean;
}) {
  const t = useI18n("admin");
  const locale = useLocale();
  const today = DateTime.now().toISODate();

  const appointmentChart = weekDayCounts.map((day) => ({
    ...day,
    label: DateTime.fromISO(day.date).toFormat("ccc", { locale }),
    isToday: day.date === today,
  }));

  const customerChart = (customerData ?? []).map((day) => ({
    ...day,
    label: DateTime.fromISO(day.date).toFormat("ccc", { locale }),
  }));

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
        {t("dashboard.overview.weekSnapshot")}
      </h2>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t("dashboard.overview.appointmentsThisWeek")}
          </p>
          <div className="mb-3 flex gap-1">
            {appointmentChart.map((day) => (
              <Link
                key={day.date}
                href={calendarHref(day.date, member)}
                variant="standalone"
                className={cn(
                  "flex-1 rounded-md px-1 py-1 text-center text-xs",
                  day.isToday
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {day.label}
              </Link>
            ))}
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  width={28}
                />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Bar
                  dataKey="count"
                  name={t("dashboard.overview.appointments")}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {showCustomerChart ? (
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("dashboard.overview.newVsReturning")}
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Area
                    type="monotone"
                    dataKey="newCustomers"
                    name={t("dashboard.overview.newCustomers")}
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.25)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="returningCustomers"
                    name={t("dashboard.overview.returningCustomers")}
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground) / 0.2)"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
