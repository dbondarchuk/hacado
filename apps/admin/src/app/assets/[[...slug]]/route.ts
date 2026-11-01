import { getServicesContainer } from "@/app/utils";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
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
  ctx: RouteContext<"/assets/[[...slug]]">,
): Promise<NextResponse> {
  const params = await ctx.params;
  const servicesContainer = await getServicesContainer();
  const filePath = params.slug?.join("/");
  if (!filePath) {
    return notFound();
  }

  const result = await servicesContainer.assetsService.streamAsset(filePath);
  if (!result) {
    return notFound();
  }

  const { asset, stream } = result;

  const contentType = asset.mimeType;
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
      "content-length": `${asset.size}`,
      "Cache-Control": `public, max-age=31536000, immutable`,
    }),
  });

  return res;
}
