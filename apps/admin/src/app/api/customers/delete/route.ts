import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "customer",
    "delete",
    "AdminAPI/customers/delete",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  const body = await request.json();

  logger.debug(
    {
      customerIds: body.ids,
      count: body.ids?.length || 0,
    },
    "Processing bulk delete customers request",
  );

  const { data, error, success } = bulkDeleteSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid bulk delete request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.customersService.deleteCustomers(data.ids, actor);

    logger.debug(
      {
        customerIds: data.ids,
        count: data.ids.length,
      },
      "Customers deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        customerIds: data.ids,
        count: data.ids.length,
        error: error?.message || error?.toString(),
      },
      "Failed to delete customers",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete customers",
        code: "delete_customers_failed",
      },
      { status: 500 },
    );
  }
}
