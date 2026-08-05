import { getLoggerFactory } from "@hacado/logger";
import { getAdminUrl } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/admin/[[...slug]]">,
) {
  const logger = getLoggerFactory("AdminRoute")("GET");
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const adminUrl = getAdminUrl();

  const url = `${adminUrl}/${slug?.join("/")}?${searchParams.toString()}`;
  logger.debug({ slug, searchParams, adminUrl, url }, "Redirecting to admin");

  return NextResponse.redirect(url);
}
