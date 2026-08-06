import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

export type ChainableProxy = (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<NextResponse>;

export type MiddlewareProxy = (middleware: ChainableProxy) => ChainableProxy;
