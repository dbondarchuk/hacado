"use client";

import { AdminKeys, useI18n } from "@hacado/i18n/client";
import type { BookingStep, DateRange, PaymentSummary } from "@hacado/types";
import {
  CalendarDateRangePicker,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import { useReload } from "@hacado/ui-admin";
import { PaymentCard } from "@hacado/ui-admin-kit";
import { DateTime } from "luxon";
import { useQueryState } from "nuqs";
import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { financialOverviewSearchParams } from "./search-params";
import type {
  BookingConversionStats,
  BookingStats,
  BookingStatsOverTime,
  BookingStepBreakdown,
  CustomerDataPoint,
  FinancialMetrics,
  RevenueDataPoint,
  ServiceDataPoint,
} from "./types";

const getConvertedToLabelKey = (convertedTo: string): AdminKeys => {
  return `financialOverview.view.bookingTracking.convertedTo.${convertedTo}` as AdminKeys;
};

const dateRangeOptions = [
  "thisMonth",
  "lastMonth",
  "thisWeek",
  "lastWeek",
  "thisYear",
  "lastYear",
  "allTime",
] as const;
type DateRangeOption = (typeof dateRangeOptions)[number];

const getDateRange = (
  option: DateRangeOption,
  timeZone: string,
): DateRange | undefined => {
  const now = DateTime.now().setZone(timeZone);

  switch (option) {
    case "thisMonth":
      return {
        start: now.startOf("month").toJSDate(),
        end: now.endOf("month").toJSDate(),
      };
    case "lastMonth":
      return {
        start: now.minus({ months: 1 }).startOf("month").toJSDate(),
        end: now.minus({ months: 1 }).endOf("month").toJSDate(),
      };
    case "thisWeek":
      return {
        start: now.startOf("week").toJSDate(),
        end: now.endOf("week").toJSDate(),
      };
    case "lastWeek":
      return {
        start: now.minus({ weeks: 1 }).startOf("week").toJSDate(),
        end: now.minus({ weeks: 1 }).endOf("week").toJSDate(),
      };
    case "thisYear":
      return {
        start: now.startOf("year").toJSDate(),
        end: now.endOf("year").toJSDate(),
      };
    case "lastYear":
      return {
        start: now.minus({ years: 1 }).startOf("year").toJSDate(),
        end: now.minus({ years: 1 }).endOf("year").toJSDate(),
      };
    case "allTime":
    default:
      return {
        start: now.minus({ years: 10 }).toJSDate(),
        end: now.plus({ years: 10 }).toJSDate(),
      };
  }
};

type FinancialsTabProps =
  | {
      financialMetrics: FinancialMetrics;
      recentPayments: PaymentSummary[];
      revenueOverTime: RevenueDataPoint[];
      serviceDistribution: ServiceDataPoint[];
      customerData: CustomerDataPoint[];
      bookingStats: BookingStats;
      abandonmentBookingStepBreakdown: BookingStepBreakdown;
      bookingStatsOverTime: BookingStatsOverTime;
      bookingConversionStats: BookingConversionStats;
      loading?: false;
    }
  | {
      loading: true;
      financialMetrics?: never;
      recentPayments?: never;
      revenueOverTime?: never;
      serviceDistribution?: never;
      customerData?: never;
      bookingStats?: never;
      abandonmentBookingStepBreakdown?: never;
      bookingStatsOverTime?: never;
      bookingConversionStats?: never;
    };

const tooltipContentStyle = {
  backgroundColor: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
};

const bookingStepLabels: Record<BookingStep, AdminKeys> = {
  OPTIONS_REQUESTED:
    "financialOverview.view.bookingTracking.bookingSteps.optionsRequested",
  AVAILABILITY_CHECKED:
    "financialOverview.view.bookingTracking.bookingSteps.availabilityChecked",
  DUPLICATE_CHECKED:
    "financialOverview.view.bookingTracking.bookingSteps.duplicateChecked",
  PAYMENT_CHECKED:
    "financialOverview.view.bookingTracking.bookingSteps.paymentChecked",
  FORM_SUBMITTED:
    "financialOverview.view.bookingTracking.bookingSteps.formSubmitted",
  BOOKING_CONVERTED:
    "financialOverview.view.bookingTracking.bookingSteps.bookingConverted",
};

export const FinancialsOverviewClient: React.FC<FinancialsTabProps> = ({
  financialMetrics,
  recentPayments,
  revenueOverTime,
  serviceDistribution,
  customerData,
  bookingStats,
  abandonmentBookingStepBreakdown,
  bookingStatsOverTime,
  bookingConversionStats,
  loading,
}) => {
  const t = useI18n("admin");

  const tAdmin = useI18n("admin");

  const currencyFormat = useCurrencyFormat();

  const formatChartDate = (dateString: string) => {
    return DateTime.fromISO(dateString).toLocaleString(DateTime.DATE_SHORT);
  };

  const [start, setStart] = useQueryState(
    "start",
    financialOverviewSearchParams.start
      .withOptions({ shallow: false })
      // Default to current month if no start or end date is provided
      // This is done here and not in the search-params.ts file because
      // if deployment was done in last month, server will keep the last month's dates for default
      .withDefault(DateTime.now().startOf("month").toJSDate()),
  );

  const [end, setEnd] = useQueryState(
    "end",
    financialOverviewSearchParams.end
      .withOptions({ shallow: false })
      // Default to current month if no start or end date is provided
      // This is done here and not in the search-params.ts file because
      // if deployment was done in last month, server will keep the last month's dates for default
      .withDefault(DateTime.now().endOf("month").toJSDate()),
  );

  const { reload } = useReload();

  const [timeGrouping, setTimeGrouping] = useQueryState(
    "timeGrouping",
    financialOverviewSearchParams.timeGrouping.withOptions({ shallow: false }),
  );

  const handleCalendarChange = (range?: DateRange) => {
    setStart(range?.start || null);
    setEnd(range?.end || null);
  };

  // Format revenue data for charts
  const chartData = revenueOverTime?.map((point) => ({
    ...point,
    date: formatChartDate(point.date),
  }));

  const customerDataChart = customerData?.map((point) => ({
    ...point,
    date: formatChartDate(point.date),
  }));

  const bookingStatsChart =
    bookingStatsOverTime?.map((point) => ({
      ...point,
      date: formatChartDate(point.date),
    })) || [];

  const timeZone = useTimeZone();

  const getConvertedToLabel = (convertedTo: string) => {
    return tAdmin.has(getConvertedToLabelKey(convertedTo))
      ? tAdmin(getConvertedToLabelKey(convertedTo))
      : convertedTo;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {/* Date Range Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-end w-full">
          <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-fit">
            <div className="w-full md:w-48">
              <Select
                value={timeGrouping || "day"}
                onValueChange={(value) => setTimeGrouping(value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("financialOverview.view.timeGrouping.label")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">
                    {t("financialOverview.view.timeGrouping.daily")}
                  </SelectItem>
                  <SelectItem value="week">
                    {t("financialOverview.view.timeGrouping.weekly")}
                  </SelectItem>
                  <SelectItem value="month">
                    {t("financialOverview.view.timeGrouping.monthly")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:max-w-fit">
              <CalendarDateRangePicker
                range={{
                  start: start
                    ? DateTime.fromJSDate(start).setZone(timeZone).toJSDate()
                    : undefined,
                  end: end
                    ? DateTime.fromJSDate(end).setZone(timeZone).toJSDate()
                    : undefined,
                }}
                rangeOptions={dateRangeOptions.map((option) => ({
                  label: t(`financialOverview.view.rangeOptions.${option}`),
                  name: option,
                  value: getDateRange(option, timeZone),
                }))}
                onChange={handleCalendarChange}
                timeZone={timeZone}
              />
            </div>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {t("financialOverview.view.estimatedRevenue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {currencyFormat(financialMetrics.estimatedRevenue)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {t("financialOverview.view.totalPayments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  {currencyFormat(financialMetrics.totalPayments)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {t("financialOverview.view.netPayments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {currencyFormat(financialMetrics.netPayments)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {t("financialOverview.view.activeAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {financialMetrics.activeAppointments}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {t("financialOverview.view.declinedAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <div className="text-2xl font-bold text-red-600">
                  {financialMetrics.declinedAppointments}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Revenue Over Time Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("financialOverview.view.revenueAndPayments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => currencyFormat(value as number)}
                    />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(value, name) => [
                        currencyFormat(value as number),
                        name === "estimatedRevenue"
                          ? t("financialOverview.view.estimatedRevenue")
                          : name === "totalPayments"
                            ? t("financialOverview.view.totalPayments")
                            : name === "netPayments"
                              ? t("financialOverview.view.netPayments")
                              : name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="estimatedRevenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name={t("financialOverview.view.estimatedRevenue")}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalPayments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name={t("financialOverview.view.totalPayments")}
                    />
                    <Line
                      type="monotone"
                      dataKey="netPayments"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      name={t("financialOverview.view.netPayments")}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointment Status Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("financialOverview.view.appointmentStatusDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(value, name) => [
                        value,
                        name === "activeAppointments"
                          ? t("financialOverview.view.activeAppointments")
                          : name === "declinedAppointments"
                            ? t("financialOverview.view.declinedAppointments")
                            : name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="activeAppointments"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                      name={t("financialOverview.view.activeAppointments")}
                    />
                    <Line
                      type="monotone"
                      dataKey="declinedAppointments"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                      name={t("financialOverview.view.declinedAppointments")}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Service Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("financialOverview.view.serviceDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      dataKey="count"
                      nameKey="serviceName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ serviceName, count, revenue }) =>
                        `${serviceName}: ${count}`
                      }
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(value, name, props) => (
                        <div className="flex flex-col text-foreground">
                          <span>
                            {t("financialOverview.view.appointmentsCount", {
                              count: value,
                            })}
                          </span>
                          <span>
                            {t(
                              "financialOverview.view.estimatedRevenueFormat",
                              {
                                revenue: currencyFormat(props.payload.revenue),
                              },
                            )}
                          </span>
                        </div>
                      )}
                      labelFormatter={(label) => `${label}`}
                      separator=":"
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Acquisition vs Retention Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("financialOverview.view.customerAcquisitionVsRetention")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <AreaChart data={customerDataChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      formatter={(value, name) => [
                        value,
                        name === "newCustomers"
                          ? "New Customers"
                          : name === "returningCustomers"
                            ? "Returning Customers"
                            : name,
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="newCustomers"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="New Customers"
                    />
                    <Area
                      type="monotone"
                      dataKey="returningCustomers"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Returning Customers"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Booking Tracking Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight wrap-anywhere">
            {t("financialOverview.view.bookingTracking.title")}
          </h3>

          {/* Booking Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {t("financialOverview.view.bookingTracking.totalBookings")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {bookingStats?.total || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {t("financialOverview.view.bookingTracking.converted")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {bookingStats?.converted || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {t("financialOverview.view.bookingTracking.abandoned")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="text-2xl font-bold text-red-600">
                    {bookingStats?.abandoned || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {t("financialOverview.view.bookingTracking.conversionRate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {bookingStats?.conversionRate
                      ? `${bookingStats.conversionRate.toFixed(1)}%`
                      : "0%"}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {t("financialOverview.view.bookingTracking.abandonmentRate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="text-2xl font-bold text-orange-600">
                    {bookingStats?.abandonmentRate
                      ? `${bookingStats.abandonmentRate.toFixed(1)}%`
                      : "0%"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Booking Completion vs Abandonment Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t(
                    "financialOverview.view.bookingTracking.completionVsAbandonment",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <LineChart data={bookingStatsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        formatter={(value, name) => [
                          value,
                          name === "abandoned"
                            ? t(
                                "financialOverview.view.bookingTracking.abandoned",
                              )
                            : name === "converted"
                              ? t(
                                  "financialOverview.view.bookingTracking.converted",
                                )
                              : name === "total"
                                ? t(
                                    "financialOverview.view.bookingTracking.totalBookings",
                                  )
                                : name,
                        ]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="abandoned"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        name={t(
                          "financialOverview.view.bookingTracking.abandoned",
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="converted"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        name={t(
                          "financialOverview.view.bookingTracking.converted",
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                        name={t(
                          "financialOverview.view.bookingTracking.totalBookings",
                        )}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Abandonment by Step */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t(
                    "financialOverview.view.bookingTracking.abandonmentByStep.title",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : abandonmentBookingStepBreakdown &&
                    abandonmentBookingStepBreakdown.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={abandonmentBookingStepBreakdown}
                        dataKey="count"
                        nameKey="step"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ step, count, percentage }) =>
                          `${t(bookingStepLabels[step as BookingStep])}: ${count} (${percentage.toFixed(1)}%)`
                        }
                      >
                        {abandonmentBookingStepBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${(index * 137.5 + 50) % 360}, 70%, 50%)`}
                            name={t(
                              bookingStepLabels[entry.step as BookingStep],
                            )}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        formatter={(value, name, props) => {
                          return [
                            <div className="flex flex-col text-foreground">
                              <span>
                                {t(
                                  "financialOverview.view.bookingTracking.abandonmentByStep.count",
                                  {
                                    count: value,
                                  },
                                )}
                              </span>
                              <span>
                                {t(
                                  "financialOverview.view.bookingTracking.abandonmentByStep.percentage",
                                  {
                                    percentage:
                                      props.payload.percentage.toFixed(1),
                                  },
                                )}
                              </span>
                            </div>,
                            t(
                              bookingStepLabels[
                                props.payload.step as BookingStep
                              ],
                            ),
                          ];
                        }}
                        labelFormatter={(label) => `${label}`}
                        separator=":"
                        itemStyle={{ color: "var(--foreground)" }}
                      />
                    </PieChart>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {t(
                        "financialOverview.view.bookingTracking.abandonmentByStep.noData",
                      )}
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion by Type */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t(
                    "financialOverview.view.bookingTracking.conversionByType.title",
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : bookingConversionStats &&
                    bookingConversionStats.byType.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={bookingConversionStats.byType}
                        dataKey="count"
                        nameKey="convertedTo"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ convertedTo, count, percentage }) =>
                          `${getConvertedToLabel(convertedTo)}: ${count} (${percentage.toFixed(1)}%)`
                        }
                      >
                        {bookingConversionStats.byType.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${(index * 137.508 + 80) % 360}, 70%, 50%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        formatter={(value, name, props) => {
                          return [
                            <div className="flex flex-col text-foreground">
                              <span>
                                {t(
                                  "financialOverview.view.bookingTracking.conversionByType.count",
                                  {
                                    count: value,
                                  },
                                )}
                              </span>
                              <span>
                                {t(
                                  "financialOverview.view.bookingTracking.conversionByType.percentage",
                                  {
                                    percentage:
                                      props.payload.percentage.toFixed(1),
                                  },
                                )}
                              </span>
                            </div>,
                            getConvertedToLabel(props.payload.convertedTo),
                          ];
                        }}
                        labelFormatter={(label) => `${label}`}
                        separator=":"
                        itemStyle={{ color: "var(--foreground)" }}
                      />
                    </PieChart>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {t(
                        "financialOverview.view.bookingTracking.conversionByType.noData",
                      )}
                    </div>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 @container/recent-payments">
        <h3 className="text-2xl font-semibold leading-none tracking-tight wrap-anywhere">
          {t("financialOverview.view.recentPayments")}
        </h3>
        <div className="grid grid-cols-1 @2xl/recent-payments:grid-cols-2 @4xl/recent-payments:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <Skeleton className="w-full h-80" key={index} />
            ))
          ) : recentPayments?.length > 0 ? (
            recentPayments.map((payment) => (
              <PaymentCard
                key={payment._id}
                payment={payment}
                onDelete={reload}
              />
            ))
          ) : (
            <div className="w-full p-4 border rounded-md bg-card text-card-foreground flex items-center justify-center">
              <span className="text-foreground">
                {t("financialOverview.view.noPayments")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
