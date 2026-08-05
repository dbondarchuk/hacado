import { getActor, getServicesContainer, getWebsiteUrl } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { assetUpdateSchema, okStatus, UploadedFile } from "@hacado/types";
import { canUpdateAppointment } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/assets/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/assets/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      assetId: id,
    },
    "Getting asset by ID",
  );

  try {
    const asset = await servicesContainer.assetsService.getAsset(id);

    if (!asset) {
      logger.warn({ assetId: id }, "Asset not found");
      return NextResponse.json(
        {
          success: false,
          error: "Asset not found",
          code: "asset_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        assetId: id,
        filename: asset.filename,
        mimeType: asset.mimeType,
      },
      "Successfully retrieved asset",
    );

    const websiteUrl = await getWebsiteUrl();

    const uploadedFile: UploadedFile = {
      ...asset,
      url: `${websiteUrl}/assets/${asset.filename}`,
    };

    return NextResponse.json(uploadedFile);
  } catch (error: any) {
    logger.error(
      {
        assetId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get asset",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get asset",
        code: "get_asset_failed",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/assets/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/assets/[id]")("PATCH");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;
  const body = await request.json();
  const { data, error, success } = assetUpdateSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid asset update request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      assetId: id,
      hasDescription: !!body.description,
    },
    "Updating asset",
  );

  const existing = await servicesContainer.assetsService.getAsset(id);
  if (!existing) {
    return NextResponse.json(
      {
        success: false,
        error: "Asset not found",
        code: "asset_not_found",
      },
      { status: 404 },
    );
  }

  const mutateAuth = await assertCanMutateAsset(
    existing,
    "AdminAPI/assets/[id]",
    "PATCH",
  );
  if (!mutateAuth.ok) return mutateAuth.response;

  const actor = await getActor();
  try {
    await servicesContainer.assetsService.updateAsset(id, data, actor);

    logger.debug(
      {
        assetId: id,
      },
      "Asset updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        assetId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to update asset",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update asset",
        code: "update_asset_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/assets/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/assets/[id]")("DELETE");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      assetId: id,
    },
    "Deleting asset",
  );

  const existing = await servicesContainer.assetsService.getAsset(id);
  if (!existing) {
    logger.warn({ assetId: id }, "Asset not found for deletion");
    return NextResponse.json(
      {
        success: false,
        error: "Asset not found",
        code: "asset_not_found",
      },
      { status: 404 },
    );
  }

  const mutateAuth = await assertCanMutateAsset(
    existing,
    "AdminAPI/assets/[id]",
    "DELETE",
  );
  if (!mutateAuth.ok) return mutateAuth.response;

  const actor = await getActor();
  try {
    const asset = await servicesContainer.assetsService.deleteAsset(id, actor);

    if (!asset) {
      logger.warn({ assetId: id }, "Asset not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Asset not found",
          code: "asset_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        assetId: id,
        filename: asset.filename,
      },
      "Asset deleted successfully",
    );

    return NextResponse.json(asset);
  } catch (error: any) {
    logger.error(
      {
        assetId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete asset",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete asset",
        code: "delete_asset_failed",
      },
      { status: 500 },
    );
  }
}

async function assertCanMutateAsset(
  asset: { customerId?: string; appointmentId?: string },
  logName: string,
  method: string,
) {
  if (asset.customerId) {
    return requirePermission("customer", "update", logName, method);
  }

  if (asset.appointmentId) {
    const auth = await requirePermission(
      "appointment",
      "update",
      logName,
      method,
    );
    if (!auth.ok) return auth;

    const servicesContainer = await getServicesContainer();
    const appointment = await servicesContainer.bookingService.getAppointment(
      asset.appointmentId,
    );
    if (
      appointment &&
      !canUpdateAppointment(auth.user, appointment.memberId)
    ) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { success: false, code: "forbidden", error: "Forbidden" },
          { status: 403 },
        ),
      };
    }
    return auth;
  }

  return { ok: true as const };
}
