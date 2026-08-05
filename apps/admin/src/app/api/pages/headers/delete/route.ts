import { getActor, getServicesContainer } from "@/app/utils";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/headers/delete")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing page headers bulk delete request",
  );

  const body = await request.json();

  const { data, error, success } = bulkDeleteSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid bulk delete request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      ids: data.ids,
    },
    "Deleting page headers",
  );

  const actor = await getActor();
  try {
    await servicesContainer.pagesService.deletePageHeaders(data.ids, actor);

    logger.debug(
      {
        ids: data.ids,
      },
      "Page headers deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        ids: data.ids,
        error: error?.message || error?.toString(),
      },
      "Failed to delete page headers",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete page headers",
        code: "delete_page_headers_failed",
      },
      { status: 500 },
    );
  }
}
