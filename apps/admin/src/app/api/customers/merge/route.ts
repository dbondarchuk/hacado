import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { okStatus, zNonEmptyString } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const mergeCustomersSchema = z.object({
  targetId: zNonEmptyString("Target ID is required"),
  ids: z
    .array(zNonEmptyString("ID is required"))
    .min(1, "At least one ID is required"),
});

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "customer",
    "merge",
    "AdminAPI/customers/merge",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();
  const body = await request.json();

  logger.debug(
    {
      targetId: body.targetId,
      customerIds: body.ids,
      count: body.ids?.length || 0,
    },
    "Processing merge customers request",
  );

  const { data, error, success } = mergeCustomersSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid merge customers request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.customersService.mergeCustomers(
      data.targetId,
      data.ids,
    );

    logger.debug(
      {
        targetId: data.targetId,
        customerIds: data.ids,
        count: data.ids.length,
      },
      "Customers merged successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        targetId: data.targetId,
        customerIds: data.ids,
        count: data.ids.length,
        error: error?.message || error?.toString(),
      },
      "Failed to merge customers",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to merge customers",
        code: "merge_customers_failed",
      },
      { status: 500 },
    );
  }
}
