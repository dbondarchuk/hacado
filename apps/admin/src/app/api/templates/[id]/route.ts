import { getActor, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus, templateSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 10;

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/templates/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/templates/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      templateId: id,
    },
    "Processing template by ID API request",
  );

  const template = await servicesContainer.templatesService.getTemplate(id);

  if (!template) {
    logger.warn({ templateId: id }, "Template not found");
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  logger.debug(
    {
      templateId: id,
      templateName: template.name,
      templateType: template.type,
    },
    "Successfully retrieved template",
  );

  const headers = new Headers();
  headers.append("Cache-Control", "private, max-age=10");

  return NextResponse.json(template, { headers });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/templates/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/templates/[id]")("PUT");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      templateId: id,
    },
    "Processing update template by ID API request",
  );

  const body = await request.json();
  const { data, success, error } = templateSchema.safeParse(body);

  if (!success) {
    return NextResponse.json(
      { error: error.message, code: "invalid_request", success: false },
      { status: 400 },
    );
  }

  const actor = await getActor();
  await servicesContainer.templatesService.updateTemplate(id, data, actor);
  logger.debug("Template updated successfully", {
    templateId: id,
    templateName: data.name,
    templateType: data.type,
  });

  return NextResponse.json(okStatus);
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/templates/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/templates/[id]")("DELETE");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      templateId: id,
    },
    "Processing delete template by ID API request",
  );

  const actor = await getActor();
  const result = await servicesContainer.templatesService.deleteTemplate(
    id,
    actor,
  );

  if (!result) {
    logger.warn({ templateId: id }, "Template not found");
    return NextResponse.json(
      { error: "Template not found", code: "not_found", success: false },
      { status: 404 },
    );
  }

  logger.debug("Template deleted successfully", {
    templateId: id,
  });

  return NextResponse.json(result);
}
