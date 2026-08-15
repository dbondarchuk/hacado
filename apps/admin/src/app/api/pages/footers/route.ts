import { getActor, getServicesContainer } from "@/app/utils";
import { pageFootersSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { pageFooterSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/footers")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing pages footers API request",
  );

  const params = pageFootersSearchParamsLoader(request.nextUrl.searchParams);

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
    "Fetching page footers with parameters",
  );

  const response = await servicesContainer.pagesService.getPageFooters({
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
    "Successfully retrieved page footers",
  );

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/footers")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing page footers API request",
  );

  const body = await request.json();

  const { data, error, success } = pageFooterSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid page footer update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      pageFooterName: data.name,
    },
    "Creating new page footer",
  );

  const actor = await getActor();
  try {
    const result = await servicesContainer.pagesService.createPageFooter(
      data,
      actor,
    );

    logger.debug(
      {
        pageFooterId: result._id,
        pageFooterName: data.name,
      },
      "Page footer created successfully",
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.error(
      {
        pageFooterName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to create page footer",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create page footer",
        code: "create_page_footer_failed",
      },
      { status: 500 },
    );
  }
}
