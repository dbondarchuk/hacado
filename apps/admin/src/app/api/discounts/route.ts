import { getActor, getServicesContainer } from "@/app/utils";
import { discountsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { discountSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/discounts")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing discounts API request",
  );

  const params = discountsSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;

  const offset = (page - 1) * limit;
  const priorityIds = params.priorityId ?? undefined;
  const enabled = params.enabled ?? undefined;
  const start = params.start ?? undefined;
  const end = params.end ?? undefined;
  const type = params.type;

  const res = await servicesContainer.servicesService.getDiscounts({
    offset,
    limit,
    search,
    sort,
    priorityIds,
    enabled,
    range: {
      start,
      end,
    },
    type,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved discounts",
  );

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/discounts")("POST");
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing create discount API request",
  );

  const body = await request.json();

  const { data, error, success } = discountSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid discount update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug({ discount: data }, "Creating discount");
  const discount = await servicesContainer.servicesService.createDiscount(
    data,
    actor,
  );

  logger.debug({ discountId: discount._id }, "Discount created successfully");
  return NextResponse.json(discount, { status: 201 });
}
