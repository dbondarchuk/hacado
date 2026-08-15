import { getActor, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus, pageFooterSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/footers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/footers/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug({ id }, "Getting footer");

  try {
    const footer = await servicesContainer.pagesService.getPageFooter(id);

    if (!footer) {
      logger.warn({ id }, "Footer not found");
      return NextResponse.json(
        {
          success: false,
          error: "Footer not found",
          code: "footer_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug({ id, name: footer.name }, "Footer found");

    return NextResponse.json(footer);
  } catch (error: any) {
    logger.error(
      {
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to get page footer",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get page footer",
        code: "get_page_footer_failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/footers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/footers/[id]")("PUT");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      pageFooterId: id,
    },
    "Processing page footer update request",
  );

  const body = await request.json();

  const { data, error, success } = pageFooterSchema.safeParse(body);
  if (!success) {
    logger.warn(
      { error, pageFooterId: id },
      "Invalid page footer update model format",
    );
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      pageFooterId: id,
      pageFooterName: data.name,
    },
    "Updating page footer",
  );

  const actor = await getActor();
  try {
    await servicesContainer.pagesService.updatePageFooter(id, data, actor);

    logger.debug(
      {
        pageFooterId: id,
        pageFooterName: data.name,
      },
      "Page footer updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        pageFooterId: id,
        pageFooterName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to update page footer",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update page footer",
        code: "update_page_footer_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/footers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/footers/[id]")("DELETE");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      pageFooterId: id,
    },
    "Processing page footer delete request",
  );

  logger.debug(
    {
      pageFooterId: id,
    },
    "Deleting page footer",
  );

  const actor = await getActor();
  try {
    const footer = await servicesContainer.pagesService.deletePageFooter(
      id,
      actor,
    );

    if (!footer) {
      logger.warn({ pageFooterId: id }, "Page footer not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Page footer not found",
          code: "page_footer_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        pageFooterId: id,
        pageFooterName: footer.name,
      },
      "Page footer deleted successfully",
    );

    return NextResponse.json(footer);
  } catch (error: any) {
    logger.error(
      {
        pageFooterId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete page footer",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete page footer",
        code: "delete_page_footer_failed",
      },
      { status: 500 },
    );
  }
}
