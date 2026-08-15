import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { serviceFieldsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { fieldSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 3;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/services-fields")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing services fields API request",
  );

  const searchParams = serviceFieldsSearchParamsLoader(request);
  const includeUsage = searchParams.includeUsage ?? false;
  const search = searchParams.search ?? undefined;
  const sort = searchParams.sort ?? undefined;
  const page = searchParams.page;
  const limit = searchParams.limit;
  const offset = (page - 1) * limit;

  logger.debug(
    {
      searchParams,
    },
    "Parsed search params for service fields",
  );

  const fields = await servicesContainer.servicesService.getFields(
    {
      search,
      sort,
      offset,
      limit,
    },
    includeUsage,
  );

  logger.debug(
    {
      total: fields.total,
      count: fields.items.length,
    },
    "Successfully retrieved service fields",
  );

  const headers = new Headers();
  headers.append("Cache-Control", "private, max-age=3");

  return NextResponse.json(fields, { headers });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "service",
    "create",
    "AdminAPI/services/fields",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const body = await request.json();
  const servicesContainer = await getServicesContainer();
  const { data, error, success } = fieldSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid service field update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }
  try {
    const result = await servicesContainer.servicesService.createField(
      data,
      actor,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create service field",
        code: "create_service_field_failed",
      },
      { status: 500 },
    );
  }
}
