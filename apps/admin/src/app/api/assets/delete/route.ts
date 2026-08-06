import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { canUpdateAppointment } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/assets/delete")("POST");
  const servicesContainer = await getServicesContainer();
  const body = await request.json();

  logger.debug(
    {
      assetIds: body.ids,
      count: body.ids?.length || 0,
    },
    "Processing bulk delete assets request",
  );

  const { data, error, success } = bulkDeleteSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid bulk delete request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const assets = await Promise.all(
    data.ids.map((id) => servicesContainer.assetsService.getAsset(id)),
  );
  const found = assets.filter((asset): asset is NonNullable<typeof asset> =>
    Boolean(asset),
  );

  if (found.some((asset) => asset.customerId)) {
    const auth = await requirePermission(
      "customer",
      "update",
      "AdminAPI/assets/delete",
      "POST",
    );
    if (!auth.ok) return auth.response;
  }

  const appointmentAssets = found.filter((asset) => asset.appointmentId);
  if (appointmentAssets.length) {
    const auth = await requirePermission(
      "appointment",
      "update",
      "AdminAPI/assets/delete",
      "POST",
    );
    if (!auth.ok) return auth.response;

    for (const asset of appointmentAssets) {
      if (!asset.appointmentId) continue;
      const appointment = await servicesContainer.bookingService.getAppointment(
        asset.appointmentId,
      );
      if (
        appointment &&
        !canUpdateAppointment(auth.user, appointment.memberId)
      ) {
        return NextResponse.json(
          { success: false, code: "forbidden", error: "Forbidden" },
          { status: 403 },
        );
      }
    }
  }

  const actor = await getActor();
  try {
    await servicesContainer.assetsService.deleteAssets(data.ids, actor);

    logger.debug(
      {
        assetIds: data.ids,
        count: data.ids.length,
      },
      "Assets deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        assetIds: data.ids,
        count: data.ids.length,
        error: error?.message || error?.toString(),
      },
      "Failed to delete assets",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete assets",
        code: "delete_assets_failed",
      },
      { status: 500 },
    );
  }
}
