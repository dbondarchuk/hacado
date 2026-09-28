import { getServicesContainer } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable, ReadableOptions } from "stream";

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

type Props = RouteContext<"/assets/[[...slug]]">;

export async function GET(
  request: NextRequest,
  props: Props,
): Promise<NextResponse> {
  const params = await props.params;

  const filePath = params?.slug?.join("/");
  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const servicesContainer = await getServicesContainer();
  const result = await servicesContainer.assetsService.streamAsset(filePath);
  if (!result) {
    return new NextResponse(null, { status: 404 });
  }

  const { asset, stream } = result;

  const contentType = asset.mimeType;
  const isImage = contentType.startsWith("image/");
  const inline = isImage || request.nextUrl.searchParams.has("inline");

  const fileName = path.basename(filePath);

  const data: ReadableStream<Uint8Array> = streamFile(stream);
  const res = new NextResponse(data, {
    status: 200,
    headers: new Headers({
      "content-disposition": inline
        ? "inline"
        : `attachment; filename=${fileName}`,
      "content-type": contentType,
      "content-length": `${asset.size}`,
      "Cache-Control": `public, max-age=31536000, immutable`,
    }),
  });

  return res;
}
