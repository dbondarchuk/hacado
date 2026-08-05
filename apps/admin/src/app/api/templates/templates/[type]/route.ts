import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { CommunicationChannel } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates } from "../../../../dashboard/templates/utils";

export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/templates/templates/[type]">,
) {
  const logger = getLoggerFactory("AdminAPI/templates/templates")("GET");

  const { type } = await params;
  logger.debug(
    {
      type,
    },
    "Processing getting template templates API request",
  );

  const servicesContainer = await getServicesContainer();
  const { language } =
    await servicesContainer.configurationService.getConfiguration("brand");

  const allTemplates = (
    await getAllTemplates(type as CommunicationChannel, language)
  ).map((template) => ({
    id: template.id,
    name: template.template.name,
    type: template.template.type,
  }));

  logger.debug(
    {
      type,
      language,
      allTemplates: allTemplates.length,
    },
    "Successfully retrieved template templates",
  );

  return NextResponse.json(allTemplates);
}
