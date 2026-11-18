import { getServicesContainer, getSession } from "@/app/utils";
import { assertCanAccessConnectedApp } from "@/lib/auth/app-access";
import { getLoggerFactory } from "@hacado/logger";
import {
  APP_PROCESS_SSE_DONE,
  APP_PROCESS_SSE_ERROR,
  ConnectedAppRequestError,
  isAppProcessStream,
  type AppProcessSseErrorPayload,
} from "@hacado/types/apps";
import { parseJSON } from "@hacado/utils/fetch-with-json";
import { encodeSse, wantsEventStream } from "@hacado/utils/sse";
import { NextRequest, NextResponse } from "next/server";

function toSseErrorPayload(error: unknown): AppProcessSseErrorPayload {
  if (error instanceof ConnectedAppRequestError) {
    return {
      message: error.message,
      code: error.code,
      data: error.data,
    };
  }

  return {
    message:
      error instanceof Error ? error.message : "Failed to process app request",
    code: "process_app_request_failed",
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]/process">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]/process")("POST");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  const body = parseJSON((await request.text()) ?? "");
  const preferSse = wantsEventStream(request.headers.get("accept"));

  logger.debug(
    {
      appId: id,
      hasData: !!body,
      preferSse,
    },
    "Processing app request",
  );

  try {
    const session = await getSession();
    await assertCanAccessConnectedApp(id, session.user);
    const result = await servicesContainer.connectedAppsService.processRequest(
      id,
      body,
      request,
      session.user,
    );

    if (isAppProcessStream(result)) {
      if (preferSse) {
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (event: string, data?: unknown) => {
              if (request.signal.aborted) return;

              controller.enqueue(encodeSse(event, data));
            };

            try {
              const data = await result.run({
                emit: send,
                signal: request.signal,
              });

              if (!request.signal.aborted) {
                send(APP_PROCESS_SSE_DONE, { data });
              }
            } catch (error) {
              if (
                (error instanceof DOMException &&
                  error.name === "AbortError") ||
                (error instanceof Error && error.name === "AbortError") ||
                request.signal.aborted
              ) {
                return;
              }

              logger.error(
                {
                  appId: id,
                  error: error instanceof Error ? error.message : String(error),
                },
                "Failed to process app SSE request",
              );

              send(APP_PROCESS_SSE_ERROR, toSseErrorPayload(error));
            } finally {
              controller.close();
            }
          },
          cancel() {
            // Client disconnect — AbortSignal on the request handles cancel.
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }

      const data = await result.run({
        emit: () => undefined,
        signal: request.signal,
      });

      logger.debug(
        {
          appId: id,
          hasData: !!body,
        },
        "App request processed (stream drained as JSON)",
      );

      return NextResponse.json(data ?? null);
    }

    logger.debug(
      {
        appId: id,
        hasData: !!body,
      },
      "App request processed",
    );

    return NextResponse.json(result ?? null);
  } catch (error: any) {
    if (error?.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "forbidden" },
        { status: 403 },
      );
    }

    logger.error(
      {
        appId: id,
        hasData: !!body,
        error: error?.message || error?.toString(),
      },
      "Failed to process app request",
    );

    if (error instanceof ConnectedAppRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          data: error.data,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process app request",
        code: "process_app_request_failed",
      },
      { status: 500 },
    );
  }
}
