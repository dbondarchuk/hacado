import { getOrganizationIdAndSlug, getServicesContainer } from "@/app/utils";
import {
  checkRateLimit,
  isImageGenerationEnabled,
  type BuilderKind,
} from "@hacado/ai-builder-core";
import { createEmailBuilderAIAdapter } from "@hacado/ai-builder-email";
import { createPageBuilderAIAdapter } from "@hacado/ai-builder-page";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/builder-ai/capabilities")("GET");

  try {
    const { organizationId } = await getOrganizationIdAndSlug();
    const rate = checkRateLimit({
      key: `builder-ai-capabilities:${organizationId}`,
      limit: 120,
      windowMs: 60_000,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      );
    }

    const builder = (request.nextUrl.searchParams.get("builder") ||
      "page") as BuilderKind;

    const blockType = request.nextUrl.searchParams.get("blockType");
    const services = await getServicesContainer();
    const apps =
      builder === "email"
        ? []
        : (
            await services.connectedAppsService.getAppsByScope("ui-components")
          ).map((app) => ({
            appId: String(app._id),
            appName: app.name,
          }));

    const adapter =
      builder === "email"
        ? createEmailBuilderAIAdapter()
        : createPageBuilderAIAdapter({ builder, apps });

    if (blockType) {
      const capabilities = await adapter.getBlockAICapabilities({ blockType });
      return NextResponse.json({
        builder,
        blockType,
        capabilities,
        imageGenerationEnabled: isImageGenerationEnabled(),
      });
    }

    const context = await adapter.getBuilderContext();

    return NextResponse.json({
      ...context,
      imageGenerationEnabled: isImageGenerationEnabled(),
      documentActions: [
        {
          id: "improve_page",
          label: "Improve this document",
          labelKey: "builder.ai.actions.improveDocument",
          kind: "generative",
        },
        {
          id: "generate_missing",
          label: "Generate missing content",
          labelKey: "builder.ai.actions.generateMissing",
          kind: "generative",
        },
        {
          id: "make_professional",
          label: "Make more professional",
          labelKey: "builder.ai.actions.makeProfessional",
          kind: "generative",
        },
      ],
    });
  } catch (error) {
    logger.error({ err: error }, "builder-ai capabilities failed");
    return NextResponse.json(
      { error: "Failed to load capabilities" },
      { status: 500 },
    );
  }
}
