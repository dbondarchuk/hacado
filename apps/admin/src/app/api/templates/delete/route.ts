import { getActor, getServicesContainer } from "@/app/utils";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/templates/delete")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing delete templates API request",
  );

  const body = await request.json();
  const { data, success, error } = bulkDeleteSchema.safeParse(body);

  if (!success) {
    return NextResponse.json(
      { error: error.message, code: "invalid_request", success: false },
      { status: 400 },
    );
  }

  const actor = await getActor();
  await servicesContainer.templatesService.deleteTemplates(data.ids, actor);
  logger.debug("Templates deleted successfully", {
    ids: data.ids,
  });

  return NextResponse.json(okStatus);
}
