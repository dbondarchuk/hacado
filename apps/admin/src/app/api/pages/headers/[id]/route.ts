import { getActor, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus, pageHeaderSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/headers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/headers/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug({ id }, "Getting header");

  try {
    const header = await servicesContainer.pagesService.getPageHeader(id);

    if (!header) {
      logger.warn({ id }, "Header not found");
      return NextResponse.json(
        {
          success: false,
          error: "Header not found",
          code: "header_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug({ id, name: header.name }, "Header found");

    return NextResponse.json(header);
  } catch (error: any) {
    logger.error(
      {
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to get page header",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get page header",
        code: "get_page_header_failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/headers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/headers/[id]")("PUT");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      pageHeaderId: id,
    },
    "Processing page header update request",
  );

  const body = await request.json();

  const { data, error, success } = pageHeaderSchema.safeParse(body);
  if (!success) {
    logger.warn(
      { error, pageHeaderId: id },
      "Invalid page header update model format",
    );
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      pageHeaderId: id,
      pageHeaderName: data.name,
    },
    "Updating page header",
  );

  const actor = await getActor();
  try {
    await servicesContainer.pagesService.updatePageHeader(id, data, actor);

    logger.debug(
      {
        pageHeaderId: id,
        pageHeaderName: data.name,
      },
      "Page header updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        pageHeaderId: id,
        pageHeaderName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to update page header",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update page header",
        code: "update_page_header_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/pages/headers/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/pages/headers/[id]")("DELETE");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      pageHeaderId: id,
    },
    "Processing page header delete request",
  );

  logger.debug(
    {
      pageHeaderId: id,
    },
    "Deleting page header",
  );

  const actor = await getActor();
  try {
    const header = await servicesContainer.pagesService.deletePageHeader(
      id,
      actor,
    );

    if (!header) {
      logger.warn({ pageHeaderId: id }, "Page header not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Page header not found",
          code: "page_header_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        pageHeaderId: id,
        pageHeaderName: header.name,
      },
      "Page header deleted successfully",
    );

    return NextResponse.json(header);
  } catch (error: any) {
    logger.error(
      {
        pageHeaderId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete page header",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete page header",
        code: "delete_page_header_failed",
      },
      { status: 500 },
    );
  }
}
