import { getOrganizationId } from "@/app/utils";
import { createFinancialOverviewQueries } from "./data";
import { FinancialsOverviewClient } from "./financials-overview-client";

type FinancialsOverviewProps = {
  searchParams: {
    start: Date;
    end: Date;
    timeGrouping: string;
  };
};

export async function FinancialsOverview({
  searchParams,
}: FinancialsOverviewProps) {
  const organizationId = await getOrganizationId();
  const queries = createFinancialOverviewQueries(organizationId);

  const dateRange = {
    start: searchParams.start || undefined,
    end: searchParams.end || undefined,
  };

  const timeGrouping =
    (searchParams.timeGrouping as "day" | "week" | "month") || "day";

  const [
    financialMetrics,
    recentPayments,
    revenueOverTime,
    serviceDistribution,
    customerData,
    bookingStats,
    abandonmentBookingStepBreakdown,
    bookingStatsOverTime,
    bookingConversionStats,
  ] = await Promise.all([
    queries.getFinancialMetrics(dateRange),
    queries.getRecentPayments(12),
    queries.getRevenueOverTime(dateRange, timeGrouping),
    queries.getServiceDistribution(dateRange),
    queries.getCustomerData(dateRange, timeGrouping),
    queries.getBookingCompletionStats(dateRange),
    queries.getAbandonmentBookingStepBreakdown(dateRange),
    queries.getBookingStatsOverTime(dateRange, timeGrouping),
    queries.getBookingConversionStats(dateRange),
  ]);

  return (
    <FinancialsOverviewClient
      financialMetrics={financialMetrics}
      recentPayments={recentPayments}
      revenueOverTime={revenueOverTime}
      serviceDistribution={serviceDistribution}
      customerData={customerData}
      bookingStats={bookingStats}
      abandonmentBookingStepBreakdown={abandonmentBookingStepBreakdown}
      bookingStatsOverTime={bookingStatsOverTime}
      bookingConversionStats={bookingConversionStats}
      loading={false}
    />
  );
}
