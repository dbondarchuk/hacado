import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { PackageError, zObjectId } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  customerId: zObjectId(),
  paymentId: zObjectId().optional(),
  paymentIntentId: z.string().optional(),
  price: z.coerce.number<number>().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/packages/[id]/sell">,
) {
  const logger = getLoggerFactory("AdminAPI/packages/[id]/sell")("POST");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "sell", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const { id } = await params;
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json(
      { success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const servicesContainer = await getServicesContainer();
  try {
    const result = body.data.paymentIntentId
      ? await servicesContainer.packagesService.issueFromPayment({
          packageId: id,
          customerId: body.data.customerId,
          paymentIntentId: body.data.paymentIntentId,
          channel: "admin",
          source: actor,
        })
      : await servicesContainer.packagesService.issue({
          packageId: id,
          customerId: body.data.customerId,
          channel: "admin",
          source: actor,
          paymentId: body.data.paymentId,
          price: body.data.price,
        });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof PackageError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
