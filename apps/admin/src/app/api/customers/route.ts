import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { customersSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { customerSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(
    "customer",
    "read",
    "AdminAPI/customers",
    "GET",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing customers API request",
  );

  const searchParams = await customersSearchParamsLoader(request);

  logger.debug(
    {
      searchParams,
    },
    "Parsed search params for customers",
  );

  const page = searchParams.page;
  const search = searchParams.search ?? undefined;
  const limit = searchParams.limit;
  const sort = searchParams.sort;
  const offset = (page - 1) * limit;
  const priorityIds = searchParams.priorityId ?? undefined;

  logger.debug(
    {
      page,
      search,
      limit,
      sort,
      offset,
      priorityIds,
    },
    "Fetching customers with parameters",
  );

  const res = await servicesContainer.customersService.getCustomers({
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
    "Successfully retrieved customers",
  );

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "customer",
    "create",
    "AdminAPI/customers",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  const body = await request.json();
  const { data, error, success } = customerSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid customer update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }
  try {
    const result = await servicesContainer.customersService.createCustomer(
      data,
      actor,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create customer",
        code: "create_customer_failed",
      },
      { status: 500 },
    );
  }
}
