import { summarizeBookingProgress } from "@hacado/services/booking-tracking";
import {
  BOOKING_PROGRESS_ANALYTICS_DAILY_COLLECTION_NAME,
  CONFIGURATION_COLLECTION_NAME,
} from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import {
  type BookingProgressAnalyticsDaily,
  closedAppointmentStatuses,
  type DateRange,
  type GeneralConfiguration,
  type Payment,
  type PaymentSummary,
} from "@hacado/types";
import { Filter } from "mongodb";
import type {
  BookingConversionStats,
  BookingStats,
  BookingStatsOverTime,
  BookingStepBreakdown,
  CustomerDataPoint,
  FinancialMetrics,
  RevenueDataPoint,
  ServiceDataPoint,
  TimeGrouping,
} from "./types";

const PAYMENTS_COLLECTION_NAME = "payments";

/** Collection name for gift cards; payments linked as giftCard.paymentId are excluded (gift card purchases, not service revenue). */
const GIFT_CARDS_COLLECTION_NAME = "gift-cards";

const closedStatuses = [...closedAppointmentStatuses];

function estimatedRevenueAddFields() {
  return {
    $addFields: {
      estimatedRevenue: {
        $cond: [
          { $in: ["$status", ["confirmed", "pending"]] },
          "$totalPrice",
          {
            $cond: [
              {
                $and: [
                  { $in: ["$status", closedStatuses] },
                  { $gt: ["$netPaymentAmount", 0] },
                ],
              },
              "$netPaymentAmount",
              0,
            ],
          },
        ],
      },
    },
  };
}

function getTimeGroupingFormat(timeGrouping: TimeGrouping): string {
  switch (timeGrouping) {
    case "week":
      return "%Y-W%U";
    case "month":
      return "%Y-%m";
    case "day":
    default:
      return "%Y-%m-%d";
  }
}

export function createFinancialOverviewQueries(organizationId: string) {
  async function getFinancialMetrics(
    dateRange?: DateRange,
  ): Promise<FinancialMetrics> {
    const db = await getDbConnection();
    const appointments = db.collection("appointments");

    // Build match criteria for date filtering
    const $and: any[] = [
      {
        organizationId: organizationId,
      },
    ];

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) {
        $and.push({
          dateTime: {
            $gte: dateRange.start,
          },
        });
      }
      if (dateRange.end) {
        $and.push({
          dateTime: {
            $lte: dateRange.end,
          },
        });
      }
    }

    const pipeline = [
      { $match: { $and } },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payments",
        },
      },
      {
        $lookup: {
          from: GIFT_CARDS_COLLECTION_NAME,
          pipeline: [
            { $match: { organizationId: organizationId } },
            { $project: { paymentId: 1, _id: 0 } },
          ],
          as: "giftCardPaymentIds",
        },
      },
      {
        $addFields: {
          giftCardPaymentIdList: {
            $map: {
              input: "$giftCardPaymentIds",
              as: "g",
              in: "$$g.paymentId",
            },
          },
          paymentsExcludingGiftCardPurchases: {
            $filter: {
              input: "$payments",
              as: "p",
              cond: {
                $not: {
                  $in: ["$$p._id", { $ifNull: ["$giftCardPaymentIdList", []] }],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: "$$payment.amount",
              },
            },
          },
          totalRefundedAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: {
                  $cond: [
                    { $eq: ["$$payment.status", "refunded"] },
                    "$$payment.amount",
                    0,
                  ],
                },
              },
            },
          },
          netPaymentAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: {
                  $subtract: [
                    "$$payment.amount",
                    {
                      $add: [
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.refunds", []] },
                              as: "refund",
                              in: "$$refund.amount",
                            },
                          },
                        },
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.fees", []] },
                              as: "fee",
                              in: "$$fee.amount",
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      estimatedRevenueAddFields(),
      {
        $group: {
          _id: null,
          estimatedRevenue: { $sum: "$estimatedRevenue" },
          totalPayments: { $sum: "$totalPaidAmount" },
          netPayments: { $sum: "$netPaymentAmount" },
          activeAppointments: {
            $sum: {
              $cond: [{ $in: ["$status", ["confirmed", "pending"]] }, 1, 0],
            },
          },
          canceledAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
          },
          noShowAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "noShow"] }, 1, 0] },
          },
        },
      },
    ];

    const result = await appointments.aggregate(pipeline).toArray();
    const metrics = result[0] || {
      estimatedRevenue: 0,
      totalPayments: 0,
      netPayments: 0,
      activeAppointments: 0,
      canceledAppointments: 0,
      noShowAppointments: 0,
    };

    const financialMetrics: FinancialMetrics = {
      estimatedRevenue: metrics.estimatedRevenue || 0,
      totalPayments: metrics.totalPayments || 0,
      netPayments: metrics.netPayments || 0,
      activeAppointments: metrics.activeAppointments || 0,
      canceledAppointments: metrics.canceledAppointments || 0,
      noShowAppointments: metrics.noShowAppointments || 0,
    };

    return financialMetrics;
  }

  async function getRecentPayments(
    limit: number = 10,
    dateRange?: DateRange,
  ): Promise<PaymentSummary[]> {
    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    // Build match criteria for date filtering
    const $and: Filter<Payment>[] = [
      {
        organizationId: organizationId,
      },
    ];

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) {
        $and.push({
          paidAt: {
            $gte: dateRange.start,
          },
        });
      }
      if (dateRange.end) {
        $and.push({
          paidAt: {
            $lte: dateRange.end,
          },
        });
      }
    }

    const pipeline = [
      { $match: { $and } },
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointment",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $addFields: {
          serviceName: { $arrayElemAt: ["$appointment.option.name", 0] },
          customerName: { $arrayElemAt: ["$customer.name", 0] },
          appointment: "$$REMOVE",
        },
      },
      {
        $sort: { paidAt: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const paymentSummaries = (await payments
      .aggregate(pipeline)
      .toArray()) as PaymentSummary[];

    return paymentSummaries;
  }

  async function getRevenueOverTime(
    dateRange?: DateRange,
    timeGrouping: TimeGrouping = "day",
  ): Promise<RevenueDataPoint[]> {
    const db = await getDbConnection();
    const appointments = db.collection("appointments");

    // Build match criteria for date filtering
    const $and: any[] = [
      {
        organizationId: organizationId,
      },
    ];

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) {
        $and.push({
          dateTime: {
            $gte: dateRange.start,
          },
        });
      }
      if (dateRange.end) {
        $and.push({
          dateTime: {
            $lte: dateRange.end,
          },
        });
      }
    }

    const pipeline = [
      { $match: { $and } },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payments",
        },
      },
      {
        $lookup: {
          from: GIFT_CARDS_COLLECTION_NAME,
          pipeline: [
            { $match: { organizationId: organizationId } },
            { $project: { paymentId: 1, _id: 0 } },
          ],
          as: "giftCardPaymentIds",
        },
      },
      {
        $addFields: {
          giftCardPaymentIdList: {
            $map: {
              input: "$giftCardPaymentIds",
              as: "g",
              in: "$$g.paymentId",
            },
          },
          paymentsExcludingGiftCardPurchases: {
            $filter: {
              input: "$payments",
              as: "p",
              cond: {
                $not: {
                  $in: ["$$p._id", { $ifNull: ["$giftCardPaymentIdList", []] }],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: "$$payment.amount",
              },
            },
          },
          totalRefundedAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: {
                  $cond: [
                    { $eq: ["$$payment.status", "refunded"] },
                    "$$payment.amount",
                    0,
                  ],
                },
              },
            },
          },
          netPaymentAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: {
                  $subtract: [
                    "$$payment.amount",
                    {
                      $add: [
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.refunds", []] },
                              as: "refund",
                              in: "$$refund.amount",
                            },
                          },
                        },
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.fees", []] },
                              as: "fee",
                              in: "$$fee.amount",
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      estimatedRevenueAddFields(),
      {
        $group: {
          _id: {
            $dateToString: {
              format: getTimeGroupingFormat(timeGrouping),
              date: "$dateTime",
            },
          },
          estimatedRevenue: { $sum: "$estimatedRevenue" },
          totalPayments: { $sum: "$totalPaidAmount" },
          netPayments: { $sum: "$netPaymentAmount" },
          confirmedAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          noShowAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "noShow"] }, 1, 0] },
          },
          canceledAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] },
          },
          declinedAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          estimatedRevenue: 1,
          totalPayments: 1,
          netPayments: 1,
          confirmedAppointments: 1,
          noShowAppointments: 1,
          canceledAppointments: 1,
          declinedAppointments: 1,
        },
      },
    ];

    const revenueData = await appointments
      .aggregate<RevenueDataPoint>(pipeline)
      .toArray();

    return revenueData;
  }

  async function getServiceDistribution(
    dateRange?: DateRange,
  ): Promise<ServiceDataPoint[]> {
    const db = await getDbConnection();
    const appointments = db.collection("appointments");

    // Build match criteria for date filtering
    const $and: any[] = [
      {
        organizationId: organizationId,
      },
    ];

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) {
        $and.push({
          dateTime: {
            $gte: dateRange.start,
          },
        });
      }
      if (dateRange.end) {
        $and.push({
          dateTime: {
            $lte: dateRange.end,
          },
        });
      }
    }

    const pipeline = [
      { $match: { $and } },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payments",
        },
      },
      {
        $lookup: {
          from: GIFT_CARDS_COLLECTION_NAME,
          pipeline: [
            { $match: { organizationId: organizationId } },
            { $project: { paymentId: 1, _id: 0 } },
          ],
          as: "giftCardPaymentIds",
        },
      },
      {
        $addFields: {
          giftCardPaymentIdList: {
            $map: {
              input: "$giftCardPaymentIds",
              as: "g",
              in: "$$g.paymentId",
            },
          },
          paymentsExcludingGiftCardPurchases: {
            $filter: {
              input: "$payments",
              as: "p",
              cond: {
                $not: {
                  $in: ["$$p._id", { $ifNull: ["$giftCardPaymentIdList", []] }],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalPaidAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: "$$payment.amount",
              },
            },
          },
          netPaymentAmount: {
            $sum: {
              $map: {
                input: "$paymentsExcludingGiftCardPurchases",
                as: "payment",
                in: {
                  $subtract: [
                    "$$payment.amount",
                    {
                      $add: [
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.refunds", []] },
                              as: "refund",
                              in: "$$refund.amount",
                            },
                          },
                        },
                        {
                          $sum: {
                            $map: {
                              input: { $ifNull: ["$$payment.fees", []] },
                              as: "fee",
                              in: "$$fee.amount",
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      estimatedRevenueAddFields(),
      {
        $group: {
          _id: "$option.name",
          count: { $sum: 1 },
          revenue: { $sum: "$estimatedRevenue" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          serviceName: "$_id",
          count: 1,
          revenue: 1,
        },
      },
    ];

    const serviceDistribution = await appointments
      .aggregate<{
        serviceName: string;
        count: number;
        revenue: number;
      }>(pipeline)
      .toArray();

    return serviceDistribution;
  }

  async function getCustomerData(
    dateRange?: DateRange,
    timeGrouping: TimeGrouping = "day",
  ): Promise<CustomerDataPoint[]> {
    const db = await getDbConnection();
    const appointments = db.collection("appointments");

    // Build match criteria for date filtering
    const $and: any[] = [
      {
        organizationId: organizationId,
      },
    ];

    if (dateRange?.start || dateRange?.end) {
      if (dateRange.start) {
        $and.push({
          dateTime: {
            $gte: dateRange.start,
          },
        });
      }
      if (dateRange.end) {
        $and.push({
          dateTime: {
            $lte: dateRange.end,
          },
        });
      }
    }

    const pipeline = [
      { $match: { $and } },
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
              format: getTimeGroupingFormat(timeGrouping),
              date: "$dateTime",
            },
          },
          newCustomers: { $sum: "$isNewCustomer" },
          returningCustomers: { $sum: "$isReturningCustomer" },
          totalCustomers: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          newCustomers: 1,
          returningCustomers: 1,
          totalCustomers: 1,
        },
      },
    ];

    const customerData = await appointments
      .aggregate<{
        date: string;
        newCustomers: number;
        returningCustomers: number;
        totalCustomers: number;
      }>(pipeline)
      .toArray();

    return customerData;
  }

  async function getOrgTimeZone(): Promise<string> {
    const db = await getDbConnection();
    const general = await db
      .collection<{
        key: string;
        organizationId: string;
        value: GeneralConfiguration;
      }>(CONFIGURATION_COLLECTION_NAME)
      .findOne({ organizationId, key: "general" });
    return general?.value?.timeZone || "UTC";
  }

  async function getBookingProgressAnalytics(
    dateRange?: DateRange,
    timeGrouping: TimeGrouping = "day",
  ): Promise<{
    bookingStats: BookingStats;
    abandonmentBookingStepBreakdown: BookingStepBreakdown;
    enteredBookingStepBreakdown: BookingStepBreakdown;
    bookingStatsOverTime: BookingStatsOverTime;
    bookingConversionStats: BookingConversionStats;
  }> {
    const db = await getDbConnection();
    const collection = db.collection<BookingProgressAnalyticsDaily>(
      BOOKING_PROGRESS_ANALYTICS_DAILY_COLLECTION_NAME,
    );

    const matchFilter: Filter<BookingProgressAnalyticsDaily> = {
      organizationId,
    };
    if (dateRange?.start || dateRange?.end) {
      matchFilter.date = {};
      if (dateRange.start) matchFilter.date.$gte = dateRange.start;
      if (dateRange.end) matchFilter.date.$lte = dateRange.end;
    }

    const docs = await collection.find(matchFilter).sort({ date: 1 }).toArray();
    const timeZone = await getOrgTimeZone();
    const summary = summarizeBookingProgress(docs, timeGrouping, timeZone);

    return {
      bookingStats: summary.stats,
      abandonmentBookingStepBreakdown: summary.stoppedAt,
      enteredBookingStepBreakdown: summary.entered,
      bookingStatsOverTime: summary.overTime,
      bookingConversionStats: {
        totalConverted: summary.stats.converted,
        byType: summary.convertedTo,
        byApp: [],
      },
    };
  }

  return {
    getFinancialMetrics,
    getRecentPayments,
    getRevenueOverTime,
    getServiceDistribution,
    getCustomerData,
    getBookingProgressAnalytics,
  };
}
