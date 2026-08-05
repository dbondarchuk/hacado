import { getActor, getServicesContainer } from "@/app/utils";
import { templateSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { templateSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 10;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/templates")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing templates API request",
  );

  const params = templateSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;
  const type = params.type ?? undefined;

  const offset = (page - 1) * limit;

  logger.debug(
    {
      page,
      search,
      limit,
      sort,
      type,
      offset,
    },
    "Fetching templates with parameters",
  );

  const res = await servicesContainer.templatesService.getTemplates({
    offset,
    limit,
    search,
    sort,
    type,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved templates",
  );

  const headers = new Headers();
  headers.append("Cache-Control", "private, max-age=10");

  return NextResponse.json(res, { headers });
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/templates")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing create template API request",
  );

  const body = await request.json();
  const { data, success, error } = templateSchema.safeParse(body);

  if (!success) {
    return NextResponse.json(
      { error: error.message, code: "invalid_request", success: false },
      { status: 400 },
    );
  }

  const actor = await getActor();
  const template = await servicesContainer.templatesService.createTemplate(
    data,
    actor,
  );

  return NextResponse.json(template);
}
