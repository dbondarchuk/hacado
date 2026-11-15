import { getOrganizationIdAndSlug, getServicesContainer } from "@/app/utils";
import { createAdminBuilderAIAdapter } from "@/lib/builder-ai/create-adapter";
import { loadBuilderAIBusinessContext } from "@/lib/builder-ai/load-business-context";
import {
  assertDocumentRevision,
  BuilderAIError,
  checkRateLimit,
  runBuilderAIOrchestrator,
  selectBusinessSlice,
  type BuilderAIRequest,
  type BuilderKind,
} from "@hacado/builder-ai";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMIT = Number(process.env.BUILDER_AI_RATE_LIMIT ?? 30);
const RATE_WINDOW_MS = Number(process.env.BUILDER_AI_RATE_WINDOW_MS ?? 60_000);

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/builder-ai/chat")("POST");

  try {
    const { organizationId } = await getOrganizationIdAndSlug();
    const rate = checkRateLimit({
      key: `builder-ai:${organizationId}`,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rate.resetAt },
        { status: 429 },
      );
    }

    const body = (await request.json()) as BuilderAIRequest & {
      apps?: Array<{ appId: string; appName: string }>;
    };

    if (!body?.builder || !body?.document || !body?.message) {
      return NextResponse.json(
        { error: "builder, document, and message are required" },
        { status: 400 },
      );
    }

    const builder = body.builder as BuilderKind;
    const revisionCheck = assertDocumentRevision(
      body.document,
      body.documentRevision,
    );

    if (!revisionCheck.ok) {
      return NextResponse.json(
        {
          error: "stale_revision",
          actualRevision: revisionCheck.actual,
        },
        { status: 409 },
      );
    }

    const services = await getServicesContainer();
    const connectedApps =
      body.apps ??
      (builder === "email"
        ? []
        : (
            await services.connectedAppsService.getAppsByScope("ui-components")
          ).map((app) => ({
            appId: String(app._id),
            appName: app.appName,
          })));

    const adapter = createAdminBuilderAIAdapter({
      builder,
      apps: connectedApps,
    });

    const businessRaw = await loadBuilderAIBusinessContext(services);
    const response = await runBuilderAIOrchestrator(
      {
        builder,
        documentId: body.documentId,
        document: body.document,
        documentRevision: body.documentRevision,
        selection: body.selection,
        message: body.message,
        conversationId: body.conversationId,
        messages: body.messages,
        actionId: body.actionId,
        args: body.args,
        documentSettings: body.documentSettings,
      },
      {
        adapter,
        organizationId,
        businessRaw,
        business: selectBusinessSlice(businessRaw, [
          "profile",
          "branding",
          "contact",
          "members",
          "services",
          "addons",
          "packages",
          "social",
        ]),
        maxToolIterations: 12,
        maxCorrections: 2,
      },
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error({ err: error }, "builder-ai chat failed");

    if (error instanceof BuilderAIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.retryable ? 503 : 400 },
      );
    }

    return NextResponse.json(
      { error: "Builder AI request failed" },
      { status: 500 },
    );
  }
}
