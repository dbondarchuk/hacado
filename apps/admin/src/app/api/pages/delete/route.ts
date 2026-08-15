import { getActor, getServicesContainer } from "@/app/utils";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/delete")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing pages bulk delete request",
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
    "Deleting pages",
  );

  const actor = await getActor();
  try {
    await servicesContainer.pagesService.deletePages(data.ids, actor);

    logger.debug(
      {
        ids: data.ids,
      },
      "Pages deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        ids: data.ids,
        error: error?.message || error?.toString(),
      },
      "Failed to delete pages",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete pages",
        code: "delete_pages_failed",
      },
      { status: 500 },
    );
  }
}
