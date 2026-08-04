import { getDbConnection } from "@timelish/services/database";
import { DateTime } from "luxon";

export type DashboardStats = {
  todayCount: number;
  todayUpcoming: number;
  thisWeekCount: number;
  thisWeekCountChangePct: number | null;
  thisWeekRevenue: number;
  thisWeekRevenueChangePct: number | null;
  avgBookingValue: number;
  avgBookingValueChangePct: number | null;
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
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

export async function getDashboardStats(
  organizationId: string,
  memberId?: string,
): Promise<DashboardStats> {
  const now = DateTime.now();
  const todayStart = now.startOf("day").toJSDate();
  const todayEnd = now.endOf("day").toJSDate();
  const weekStart = now.startOf("week").toJSDate();
  const weekEnd = now.endOf("week").toJSDate();
  const lastWeekStart = now.minus({ weeks: 1 }).startOf("week").toJSDate();
  const lastWeekEnd = now.minus({ weeks: 1 }).endOf("week").toJSDate();

  const db = await getDbConnection();
  const appointments = db.collection("appointments");
  const activeStatuses = ["confirmed", "pending"];
  const memberFilter = memberId ? { memberId } : {};

  const [todayCount, todayUpcoming, thisWeek, lastWeek] = await Promise.all([
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
    getPeriodMetrics(organizationId, weekStart, weekEnd, memberId),
    getPeriodMetrics(organizationId, lastWeekStart, lastWeekEnd, memberId),
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
  };
}
