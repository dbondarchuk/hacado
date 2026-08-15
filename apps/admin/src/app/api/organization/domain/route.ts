import { getActor, getServicesContainer } from "@/app/utils";
import { organizationDomainSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/organization/domain")("POST");
  const servicesContainer = await getServicesContainer();
  const body = await request.json();
  const { data, success, error } = organizationDomainSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid custom domain payload");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.organizationService.setDomain(
      data.domain,
      await getActor(),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "domain_already_in_use") {
      logger.warn({ domain: data.domain }, "Domain is already in use");
      return NextResponse.json(
        {
          error: "Domain is already in use",
          success: false,
          code: "domain_already_in_use",
        },
        { status: 409 },
      );
    }
    throw error;
  }
  logger.debug({ domain: data.domain }, "Domain updated");
  return NextResponse.json(okStatus, { status: 200 });
}

export async function DELETE() {
  const logger = getLoggerFactory("AdminAPI/organization/domain")("DELETE");
  const servicesContainer = await getServicesContainer();
  await servicesContainer.organizationService.setDomain(
    undefined,
    await getActor(),
  );
  logger.debug("Domain removed");
  return NextResponse.json(okStatus, { status: 200 });
}
