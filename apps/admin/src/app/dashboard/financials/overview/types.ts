export type FinancialMetrics = {
  estimatedRevenue: number;
  totalPayments: number;
  netPayments: number;
  activeAppointments: number;
  canceledAppointments: number;
  noShowAppointments: number;
};

export type RevenueDataPoint = {
  date: string;
  estimatedRevenue: number;
  totalPayments: number;
  netPayments: number;
  confirmedAppointments: number;
  noShowAppointments: number;
  canceledAppointments: number;
  declinedAppointments: number;
};

export type ServiceDataPoint = {
  serviceName: string;
  count: number;
  revenue: number;
};

export type CustomerDataPoint = {
  date: string;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
};

export type TimeGrouping = "day" | "week" | "month";

export type BookingStats = {
  total: number;
  abandoned: number;
  converted: number;
  abandonmentRate: number;
  conversionRate: number;
};

export type BookingStepBreakdownItem = {
  step: string;
  count: number;
  percentage: number;
};

export type BookingStepBreakdown = BookingStepBreakdownItem[];

export type BookingStatOverTime = {
  date: string;
  total: number;
  abandoned: number;
  converted: number;
};

export type BookingStatsOverTime = BookingStatOverTime[];

export type BookingConversionStatByType = {
  convertedTo: string;
  count: number;
  percentage: number;
};

export type BookingConversionStatByApp = {
  convertedAppName: string | null;
  count: number;
  percentage: number;
};

export type BookingConversionStats = {
  totalConverted: number;
  byType: BookingConversionStatByType[];
  byApp: BookingConversionStatByApp[];
};
