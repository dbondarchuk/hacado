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
    bookingProgress,
  ] = await Promise.all([
    queries.getFinancialMetrics(dateRange),
    queries.getRecentPayments(12),
    queries.getRevenueOverTime(dateRange, timeGrouping),
    queries.getServiceDistribution(dateRange),
    queries.getCustomerData(dateRange, timeGrouping),
    queries.getBookingProgressAnalytics(dateRange, timeGrouping),
  ]);

  return (
    <FinancialsOverviewClient
      financialMetrics={financialMetrics}
      recentPayments={recentPayments}
      revenueOverTime={revenueOverTime}
      serviceDistribution={serviceDistribution}
      customerData={customerData}
      bookingStats={bookingProgress.bookingStats}
      abandonmentBookingStepBreakdown={
        bookingProgress.abandonmentBookingStepBreakdown
      }
      enteredBookingStepBreakdown={bookingProgress.enteredBookingStepBreakdown}
      bookingStatsOverTime={bookingProgress.bookingStatsOverTime}
      bookingConversionStats={bookingProgress.bookingConversionStats}
      loading={false}
    />
  );
}
