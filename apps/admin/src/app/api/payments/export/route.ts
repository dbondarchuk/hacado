import { getServicesContainer } from "@/app/utils";
import { buildPaymentsExportCsv } from "@/lib/payments-export-csv";
import { paymentsSearchParamsLoader } from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { PaymentsExportLimitExceededError } from "@hacado/services";
import { PAYMENTS_EXPORT_MAX_ROWS } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/payments/export")("GET");
  const servicesContainer = await getServicesContainer();
  const t = await getI18nAsync("admin");

  const params = paymentsSearchParamsLoader(request.nextUrl.searchParams);

  const start = params.start ?? undefined;
  const end = params.end ?? undefined;
  const range =
    start || end
      ? {
          start,
          end,
        }
      : undefined;

  const customerId = params.customerId?.[0] ?? undefined;
  const appointmentId = params.appointmentId?.[0] ?? undefined;
  const search = params.search ?? undefined;
  const type = params.type ?? undefined;
  const method = params.method ?? undefined;
  const sort = params.sort ?? undefined;

  logger.debug(
    {
      range,
      customerId,
      appointmentId,
      search,
      type,
      method,
      sort,
    },
    "Exporting payments",
  );

  try {
    const payments = await servicesContainer.paymentsService.listForExport({
      range,
      customerId,
      appointmentId,
      search,
      type,
      method,
      sort,
    });

    const csv = buildPaymentsExportCsv(payments, t);
    const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    const body = `\uFEFF${csv}`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof PaymentsExportLimitExceededError) {
      logger.warn(
        { count: error.count, limit: error.limit },
        "Payments export limit exceeded",
      );

      return NextResponse.json(
        {
          success: false,
          code: "export_limit_exceeded",
          message: t("paymentsList.exportCsvTooMany", {
            limit: PAYMENTS_EXPORT_MAX_ROWS,
          }),
          limit: error.limit,
          count: error.count,
        },
        { status: 413 },
      );
    }

    logger.error({ error }, "Failed to export payments");

    return NextResponse.json(
      {
        success: false,
        code: "export_failed",
        message: t("paymentsList.exportCsvError"),
      },
      { status: 500 },
    );
  }
}
