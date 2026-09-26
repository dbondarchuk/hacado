import { getOrganizationId } from "../utils";
import {
  getDashboardCustomerWeekData,
  getDashboardStats,
} from "./dashboard-stats";
import { WeekSnapshotCharts } from "./week-snapshot-charts";

export async function WeekSnapshot({
  memberId,
  member,
  showCustomerChart,
}: {
  memberId?: string;
  member?: string;
  showCustomerChart: boolean;
}) {
  const organizationId = await getOrganizationId();
  const [stats, customerData] = await Promise.all([
    getDashboardStats(organizationId, memberId),
    showCustomerChart
      ? getDashboardCustomerWeekData(organizationId, memberId)
      : Promise.resolve(undefined),
  ]);

  return (
    <WeekSnapshotCharts
      weekDayCounts={stats.weekDayCounts}
      customerData={customerData}
      member={member}
      showCustomerChart={showCustomerChart}
    />
  );
}
