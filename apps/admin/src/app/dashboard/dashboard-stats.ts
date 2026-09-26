import { getDbConnection } from "@hacado/services/database";
import { DateTime } from "luxon";
import { getServicesContainer } from "../utils";

export type DashboardWeekDayCount = {
  date: string;
  count: number;
};

export type DashboardCustomerDayPoint = {
  date: string;
  newCustomers: number;
  returningCustomers: number;
};

export type DashboardStats = {
  todayCount: number;
  todayUpcoming: number;
  thisWeekCount: number;
  thisWeekCountChangePct: number | null;
  thisWeekRevenue: number;
  thisWeekRevenueChangePct: number | null;
  avgBookingValue: number;
  avgBookingValueChangePct: number | null;
  weekDayCounts: DashboardWeekDayCount[];
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

async function getOrganizationTimeZone(): Promise<string> {
  const services = await getServicesContainer();
  const { timeZone } =
    await services.configurationService.getConfiguration("general");

  return timeZone || "UTC";
}

async function getPeriodMetrics(
  organizationId: string,
  start: Date,
  end: Date,
  memberId?: string,
): Promise<{ count: number; revenue: number }> {
  const db = await getDbConnection();
  const appointments = db.collection("appointments");

  const result = await appointments
    .aggregate<{ count: number; revenue: number }>([
      {
        $match: {
          organizationId,
          status: { $in: ["confirmed", "pending"] },
          dateTime: { $gte: start, $lte: end },
          ...(memberId ? { memberId } : {}),
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$totalPrice", 0] } },
        },
      },
    ])
    .toArray();

  return result[0] ?? { count: 0, revenue: 0 };
}

async function getWeekDayCounts(
  organizationId: string,
  weekStart: DateTime,
  timeZone: string,
  memberId?: string,
): Promise<DashboardWeekDayCount[]> {
  const db = await getDbConnection();
  const appointments = db.collection("appointments");
  const start = weekStart.startOf("day").toJSDate();
  const end = weekStart.endOf("week").toJSDate();

  const rows = await appointments
    .aggregate<{ date: string; count: number }>([
      {
        $match: {
          organizationId,
          status: { $in: ["confirmed", "pending"] },
          dateTime: { $gte: start, $lte: end },
          ...(memberId ? { memberId } : {}),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dateTime",
              timezone: timeZone,
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
    ])
    .toArray();

  const byDate = new Map(rows.map((row) => [row.date, row.count]));
  const days: DashboardWeekDayCount[] = [];
  for (let i = 0; i < 7; i++) {
    const day = weekStart.plus({ days: i });
    const date = day.toISODate()!;
    days.push({ date, count: byDate.get(date) ?? 0 });
  }
  return days;
}

export async function getDashboardCustomerWeekData(
  organizationId: string,
  memberId?: string,
): Promise<DashboardCustomerDayPoint[]> {
  const timeZone = await getOrganizationTimeZone();
  const now = DateTime.now().setZone(timeZone);
  const weekStart = now.startOf("week");
  const start = weekStart.toJSDate();
  const end = now.endOf("week").toJSDate();
  const db = await getDbConnection();
  const appointments = db.collection("appointments");

  const rows = await appointments
    .aggregate<{
      date: string;
      newCustomers: number;
      returningCustomers: number;
    }>([
      {
        $match: {
          organizationId,
          status: { $in: ["confirmed", "pending"] },
          dateTime: { $gte: start, $lte: end },
          ...(memberId ? { memberId } : {}),
        },
      },
      {
        $lookup: {
          from: "appointments",
          let: { customerId: "$customerId", currentDate: "$dateTime" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$customerId", "$$customerId"] },
                    { $lt: ["$dateTime", "$$currentDate"] },
                  ],
                },
              },
            },
          ],
          as: "previousAppointments",
        },
      },
      {
        $addFields: {
          isNewCustomer: {
            $cond: [{ $eq: [{ $size: "$previousAppointments" }, 0] }, 1, 0],
          },
          isReturningCustomer: {
            $cond: [{ $gt: [{ $size: "$previousAppointments" }, 0] }, 1, 0],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dateTime",
              timezone: timeZone,
            },
          },
          newCustomers: { $sum: "$isNewCustomer" },
          returningCustomers: { $sum: "$isReturningCustomer" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          newCustomers: 1,
          returningCustomers: 1,
        },
      },
    ])
    .toArray();

  const byDate = new Map(rows.map((row) => [row.date, row]));
  const days: DashboardCustomerDayPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const day = weekStart.plus({ days: i });
    const date = day.toISODate()!;
    const point = byDate.get(date);
    days.push({
      date,
      newCustomers: point?.newCustomers ?? 0,
      returningCustomers: point?.returningCustomers ?? 0,
    });
  }
  return days;
}

export async function getDashboardStats(
  organizationId: string,
  memberId?: string,
): Promise<DashboardStats> {
  const timeZone = await getOrganizationTimeZone();
  const now = DateTime.now().setZone(timeZone);

  const todayStart = now.startOf("day").toJSDate();
  const todayEnd = now.endOf("day").toJSDate();
  const weekStart = now.startOf("week");
  const weekEnd = now.endOf("week").toJSDate();
  const lastWeekStart = now.minus({ weeks: 1 }).startOf("week").toJSDate();
  const lastWeekEnd = now.minus({ weeks: 1 }).endOf("week").toJSDate();

  const db = await getDbConnection();
  const appointments = db.collection("appointments");
  const activeStatuses = ["confirmed", "pending"];
  const memberFilter = memberId ? { memberId } : {};

  const [todayCount, todayUpcoming, thisWeek, lastWeek, weekDayCounts] =
    await Promise.all([
      appointments.countDocuments({
        organizationId,
        status: { $in: activeStatuses },
        dateTime: { $gte: todayStart, $lte: todayEnd },
        ...memberFilter,
      }),
      appointments.countDocuments({
        organizationId,
        status: { $in: activeStatuses },
        dateTime: { $gte: now.toJSDate(), $lte: todayEnd },
        ...memberFilter,
      }),
      getPeriodMetrics(organizationId, weekStart.toJSDate(), weekEnd, memberId),
      getPeriodMetrics(organizationId, lastWeekStart, lastWeekEnd, memberId),
      getWeekDayCounts(organizationId, weekStart, timeZone, memberId),
    ]);

  const avgBookingValue =
    thisWeek.count > 0 ? thisWeek.revenue / thisWeek.count : 0;
  const lastAvgBookingValue =
    lastWeek.count > 0 ? lastWeek.revenue / lastWeek.count : 0;

  return {
    todayCount,
    todayUpcoming,
    thisWeekCount: thisWeek.count,
    thisWeekCountChangePct: pctChange(thisWeek.count, lastWeek.count),
    thisWeekRevenue: thisWeek.revenue,
    thisWeekRevenueChangePct: pctChange(thisWeek.revenue, lastWeek.revenue),
    avgBookingValue,
    avgBookingValueChangePct: pctChange(avgBookingValue, lastAvgBookingValue),
    weekDayCounts,
  };
}
