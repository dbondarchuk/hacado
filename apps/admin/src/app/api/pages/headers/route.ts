import { getActor, getServicesContainer } from "@/app/utils";
import { pageHeadersSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { pageHeaderSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/headers")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing pages headers API request",
  );

  const params = pageHeadersSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search || undefined;
  const limit = params.limit;
  const sort = params.sort;
  const priorityIds = params.priorityId ?? undefined;

  const offset = (page - 1) * limit;

  logger.debug(
    {
      page,
      search,
      limit,
      sort,
      offset,
      priorityIds,
    },
    "Fetching page headers with parameters",
  );

  const response = await servicesContainer.pagesService.getPageHeaders({
    search,
    limit,
    sort,
    offset,
    priorityIds,
  });

  logger.debug(
    {
      total: response.total,
      count: response.items.length,
    },
    "Successfully retrieved page headers",
  );

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/headers")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing page headers API request",
  );

  const body = await request.json();

  const { data, error, success } = pageHeaderSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid page header update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      pageHeaderName: data.name,
    },
    "Creating new page header",
  );

  const actor = await getActor();
  try {
    const result = await servicesContainer.pagesService.createPageHeader(
      data,
      actor,
    );

    logger.debug(
      {
        pageHeaderId: result._id,
        pageHeaderName: data.name,
      },
      "Page header created successfully",
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.error(
      {
        pageHeaderName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to create page header",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create page header",
        code: "create_page_header_failed",
      },
      { status: 500 },
    );
  }
}
