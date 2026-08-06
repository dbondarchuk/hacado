import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { serviceOptionsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import {
  appointmentOptionSchema,
  ServiceLimitReachedError,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/services/options")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing options API request",
  );

  const params = serviceOptionsSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;

  const offset = (page - 1) * limit;
  const priorityIds = params.priorityId ?? undefined;

  logger.debug(
    {
      page,
      search,
      limit,
      sort,
      offset,
      priorityIds,
    },
    "Fetching options with parameters",
  );

  const res = await servicesContainer.servicesService.getOptions({
    offset,
    limit,
    search,
    sort,
    priorityIds,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved options",
  );

  const headers = new Headers();
  headers.append("Cache-Control", "private, max-age=3");

  return NextResponse.json(res, { headers });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "service",
    "create",
    "AdminAPI/services/options",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing service options API request",
  );

  const body = await request.json();

  const { data, error, success } = appointmentOptionSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid service option update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      optionName: data.name,
      optionDurationType: data.durationType,
      optionDurationMin:
        data.durationType === "flexible" ? data.durationMin : undefined,
      optionDurationMax:
        data.durationType === "flexible" ? data.durationMax : undefined,
      optionDurationStep:
        data.durationType === "flexible" ? data.durationStep : undefined,
      optionPricePerHour:
        data.durationType === "flexible" ? data.pricePerHour : undefined,
      optionPrice: data.durationType === "fixed" ? data.price : undefined,
      optionDuration: data.durationType === "fixed" ? data.duration : undefined,
    },
    "Creating new service option",
  );

  try {
    const result = await servicesContainer.servicesService.createOption(
      data,
      actor,
    );

    logger.debug(
      {
        optionId: result._id,
        optionName: data.name,
      },
      "Service option created successfully",
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceLimitReachedError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
          limit: error.limit,
          settingsUrl: "/dashboard/settings/brand?activeTab=general",
        },
        { status: 402 },
      );
    }
    logger.error(
      {
        optionName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to create service option",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create service option",
        code: "create_service_option_failed",
      },
      { status: 500 },
    );
  }
}
