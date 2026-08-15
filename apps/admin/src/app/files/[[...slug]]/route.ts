import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { fileNameToMimeType } from "@hacado/utils";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { sanitizePath } from "sanitize-filepath";
import { Readable, ReadableOptions } from "stream";

export const dynamic = "force-dynamic";

/**
 * Return a stream from the disk
 * @param {string} path - The location of the file
 * @param {ReadableOptions} options - The streamable options for the stream (ie how big are the chunks, start, end, etc).
 * @returns {ReadableStream} A readable stream of the file
 */
function streamFile(
  downloadStream: Readable,
  options?: ReadableOptions,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      downloadStream.on("data", (chunk: Buffer | string) =>
        controller.enqueue(
          new Uint8Array(
            typeof chunk === "string" ? Buffer.from(chunk, "utf-8") : chunk,
          ),
        ),
      );
      downloadStream.on("end", () => controller.close());
      downloadStream.on("error", (error: NodeJS.ErrnoException) =>
        controller.error(error),
      );
    },
    cancel() {
      downloadStream.destroy();
    },
  });
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/files/[[...slug]]">,
): Promise<NextResponse> {
  const params = await ctx.params;
  const servicesContainer = await getServicesContainer();
  const logger = getLoggerFactory("AdminAPI/files/[...slug]")("GET");

  const unSafeFilePath = params.slug?.join("/");
  if (!unSafeFilePath) {
    logger.warn({ unSafeFilePath }, "No filename provided");
    return notFound();
  }

  const filePath = sanitizePath(unSafeFilePath);

  logger.debug({ filePath }, "Getting file from storage");
  const result = await servicesContainer.assetsStorage.getFile(filePath);
  if (!result) {
    logger.warn({ filePath }, "File not found");
    return notFound();
  }

  const { stream, contentLength } = result;
  const contentType =
    fileNameToMimeType(filePath) || "application/octet-stream";
  logger.debug(
    { filePath, contentLength, contentType },
    "File found, streaming it.",
  );
  const inline = request.nextUrl.searchParams.has("inline");

  const fileName = path.basename(filePath);

  const data: ReadableStream<Uint8Array> = streamFile(stream); // Stream the file with a 1kb chunk
  const res = new NextResponse(data, {
    status: 200,
    headers: new Headers({
      //Headers
      "content-disposition": inline
        ? "inline"
        : `attachment; filename=${fileName}`, //State that this is a file attachment
      "content-type": contentType,
      "content-length": `${contentLength}`,
      "Cache-Control": `public, max-age=31536000, immutable`,
    }),
  });

  return res;
}
